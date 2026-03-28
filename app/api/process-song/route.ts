export const maxDuration = 60; // Tells Vercel to allow up to 60 seconds

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { inputMethod, payload, language } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Missing Gemini API Key' }, { status: 500 });
    }

    let parts: any[] = [];

    // 1. IF IT IS AN IMAGE: We download the Firebase image and convert it to Base64 for the AI
    if (inputMethod === 'image') {
      const imageResp = await fetch(payload);
      const arrayBuffer = await imageResp.arrayBuffer();
      const base64Image = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = imageResp.headers.get('content-type') || 'image/jpeg';

      parts.push({ inline_data: { mime_type: mimeType, data: base64Image } });
      parts.push({ text: `Extract the lyrics from this image. The original language is ${language}. Then provide the transliteration and meanings.` });
    } 
    // 2. IF IT IS TEXT: We just pass the text directly
    else {
      parts.push({ text: `Here are the lyrics of a song in ${language}:\n\n${payload}\n\nClean up the formatting, then provide the transliteration and meanings.` });
    }

    // 3. THE MASTER COMMAND: Tell the AI exactly how we want the data back
    const systemPrompt = `You are a helpful assistant for a church app. You must respond ONLY with a valid JSON object.
    The JSON must have exactly these 4 string keys:
    "lyrics": The song lyrics in the original language.
    "transliterationEnglish": The lyrics phonetically spelled out using English letters.
    "meaningEnglish": A 2-3 sentence summary of the song's meaning in English.
    "meaningMalayalam": A 2-3 sentence summary of the song's meaning in Malayalam.`;

    parts.push({ text: systemPrompt });

    // 4. CALL THE GEMINI API
    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.2, // Keeps the AI highly accurate and less "creative"
          response_mime_type: "application/json" // Forces Gemini to return pure JSON!
        }
      })
    });

    const data = await apiResponse.json();
    
    // Parse the JSON string Gemini sends back into a real JavaScript object
    const aiText = data.candidates[0].content.parts[0].text;
    const parsedResult = JSON.parse(aiText);

    return NextResponse.json(parsedResult);

  } catch (error) {
    console.error("AI Processing Error:", error);
    return NextResponse.json({ error: 'Failed to process song' }, { status: 500 });
  }
}