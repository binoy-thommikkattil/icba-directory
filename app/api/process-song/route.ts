export const maxDuration = 60; // Allow Vercel up to 60 seconds to process

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-session';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const rateLimited = rateLimit(req);
    if (rateLimited) return rateLimited;

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inputMethod, payload, language, title, originalAuthor } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      console.error("API Key is missing from environment variables.");
      return NextResponse.json({ error: 'Missing Gemini API Key' }, { status: 500 });
    }

    let parts: any[] = [];

    const imageUrls = Array.isArray(payload) ? payload.filter(Boolean) : [payload].filter(Boolean);

    // 1. IF IT IS AN IMAGE
    if (inputMethod === 'image') {
      if (imageUrls.length === 0) {
        return NextResponse.json({ error: 'No image provided' }, { status: 400 });
      }

      for (const imageUrl of imageUrls) {
        const imageResp = await fetch(imageUrl);
        if (!imageResp.ok) {
          return NextResponse.json({ error: `Unable to fetch image: ${imageUrl}` }, { status: 400 });
        }
        const arrayBuffer = await imageResp.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = imageResp.headers.get('content-type') || 'image/jpeg';

        parts.push({ inline_data: { mime_type: mimeType, data: base64Image } });
      }

      parts.push({
        text: imageUrls.length > 1
          ? `Extract the lyrics from these images. If multiple pages or photos were provided, combine them into one coherent extraction and preserve the song structure.`
          : `Extract the lyrics from this image.`
      });
    }
    // 2. IF IT IS TEXT
    else {
      parts.push({ text: `Here are the lyrics of a song:\n\n${payload}\n\nClean up the formatting and provide the requested data.` });
    }

    // Pass the user's manual inputs to the AI so it knows what to skip or fix
    parts.push({ text: `User provided Title: "${title || 'NONE'}". User provided Author: "${originalAuthor || 'NONE'}". User provided Language: "${language}".` });

    // 3. THE MASTER MUSIC HISTORIAN COMMAND
    const systemPrompt = `You are a masterful poetic translator, a Christian music historian, and a linguist. You must respond ONLY with a valid JSON object.
    
    The JSON must have exactly these 9 string keys:
    
    "title": For the title, you MUST output the phonetic transliteration of the original language using the English alphabet (e.g., Manglish or Hinglish). Do NOT translate the meaning of the words into English. Example: If the original title is "ആരാധിക്കും", you must output "Aaradhikkum", NOT "We will worship".
    
    "language": The language of the song. If the user provided "Auto-Detect", identify the exact language (e.g., Malayalam, Hindi, Kannada, Telugu, Gujarati, Tamil, English).
    
    "originalAuthor": The composer or writer. If the user provided an author, use it. If no author is provided, only return an author if you are 100% certain based on explicit evidence from the provided text or image. DO NOT guess or infer from style, language, or theme. If the writer is not explicitly written in the provided text/image, or if you are not 100% certain of the factual attribution, return the exact string "Unknown". Do not return an empty string.

    "lyrics": The song lyrics in the original language, cleanly formatted with clear stanza breaks.
    
    "transliterationEnglish": The lyrics phonetically spelled out using English letters, matching the lyrics perfectly so a user can sing along. Keep repetitions.
    
    "transliterationMalayalam": The exact pronunciation of the lyrics spelled out using MALAYALAM letters. This is CRITICAL for songs in Hindi, Kannada, Telugu, Tamil, etc., so a Malayalam reader can read and sing the non-Malayalam words. If the original language is already Malayalam, you can leave this blank.
    
    "meaningEnglish": A deeply poetic translation. CRITICAL RULE: If the original lyrics repeat a line multiple times, DO NOT redundantly repeat the translation. Group it elegantly.
    
    "meaningMalayalam": A poetic translation into Malayalam leveraging shared linguistic roots. Apply the same anti-repetition rule.
    
    "story": A concise, 3-5 sentence historical background or story behind the writing of this song. CRITICAL ANTI-HALLUCINATION RULE: If you do not have highly confident, verifiable facts about this specific song, you MUST return an empty string "". DO NOT guess.`;

    parts.push({ text: systemPrompt });

    // 4. CALL THE GEMINI API
    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.2, // Lowered slightly to ensure stricter adherence to the V Nagel formatting rules
          response_mime_type: "application/json"
        }
      })
    });

    const data = await apiResponse.json();

    // 5. BULLETPROOF ERROR HANDLING
    if (!apiResponse.ok || !data.candidates) {
      console.error("Google Gemini API rejected the request. Details:", JSON.stringify(data, null, 2));
      const errorMessage = data.error?.message || "Unknown AI API Error";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    const aiText = data.candidates[0].content.parts[0].text;
    const parsedResult = JSON.parse(aiText);

    const normalizedResult = {
      ...parsedResult,
      title: parsedResult.title?.trim() || 'Untitled Song',
      originalAuthor: parsedResult.originalAuthor?.trim() || 'Unknown',
      language: parsedResult.language?.trim() || 'Unknown',
    };

    return NextResponse.json(normalizedResult);

  } catch (error) {
    console.error("Internal API Route Error:", error);
    return NextResponse.json({ error: 'Failed to process song backend' }, { status: 500 });
  }
}