export const maxDuration = 60; // Allow Vercel up to 60 seconds to process

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { inputMethod, payload, language } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      console.error("API Key is missing from environment variables.");
      return NextResponse.json({ error: 'Missing Gemini API Key' }, { status: 500 });
    }

    let parts: any[] = [];

    // 1. IF IT IS AN IMAGE
    if (inputMethod === 'image') {
      const imageResp = await fetch(payload);
      const arrayBuffer = await imageResp.arrayBuffer();
      const base64Image = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = imageResp.headers.get('content-type') || 'image/jpeg';

      parts.push({ inline_data: { mime_type: mimeType, data: base64Image } });
      parts.push({ text: `Extract the lyrics from this image. The original language is ${language}.` });
    }
    // 2. IF IT IS TEXT
    else {
      parts.push({ text: `Here are the lyrics of a song in ${language}:\n\n${payload}\n\nClean up the formatting and provide the translations requested.` });
    }

    // 3. THE MASTER POETIC COMMAND (Now with History/Story generation!)
    const systemPrompt = `You are a masterful poetic translator and an assistant for a church app. You must respond ONLY with a valid JSON object.
    The JSON must have exactly these 5 string keys:
    
    "lyrics": The song lyrics in the original language, cleanly formatted with clear stanza breaks.
    
    "transliterationEnglish": The lyrics phonetically spelled out using English letters, line-by-line matching the original lyrics perfectly so a user can sing along.
    
    "meaningEnglish": A deeply poetic, line-by-line translation of the song into English. DO NOT summarize. Translate stanza by stanza.
    
    "meaningMalayalam": A poetic, line-by-line translation into Malayalam. CRITICAL INSTRUCTION FOR INDIAN LANGUAGES: Whether the original song is in Tamil, Kannada, Hindi, or Telugu, you MUST leverage shared linguistic roots when translating to Malayalam. Translate stanza by stanza, line by line.
    
    "story": "A concise, 3-5 sentence historical background or story behind the writing of this song, including the original composer/author if known. CRITICAL ANTI-HALLUCINATION RULE: If you do not have highly confident, verifiable historical facts about the origins of this specific song, you MUST return an empty string (''). DO NOT guess. DO NOT invent a story. DO NOT provide generic information. It is strictly better to return an empty string than to provide false information."`; // <--- ADDED CLOSING BACKTICK AND SEMICOLON HERE
    
    parts.push({ text: systemPrompt });

    // 4. CALL THE GEMINI API
    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.4, // Increased slightly to allow for poetic creativity!
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

    return NextResponse.json(parsedResult);

  } catch (error) {
    console.error("Internal API Route Error:", error);
    return NextResponse.json({ error: 'Failed to process song backend' }, { status: 500 });
  }
}