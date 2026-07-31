import { NextRequest, NextResponse } from 'next/server';
import { Communicate } from 'edge-tts-universal';

export async function POST(req: NextRequest) {
  try {
    const { text, voice } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text parameter is required' }, { status: 400 });
    }

    // Default voice: Realistic Microsoft Edge Neural Female Voice ('en-US-AvaNeural')
    const femaleVoice = voice || process.env.EDGE_TTS_VOICE || 'en-US-AvaNeural';

    // Clean input text for natural TTS output
    const cleanText = text
      .replace(/\[ID:[^\]]+\]/g, '')
      .replace(/[*#_~`]/g, '')
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      return NextResponse.json({ error: 'text is empty after sanitization' }, { status: 400 });
    }

    // Pure JS WebSocket TTS synthesis — works in Vercel serverless runtime without Python
    const communicate = new Communicate(cleanText, { voice: femaleVoice });
    const chunks: Uint8Array[] = [];
    const stream = await communicate.stream();

    for await (const chunk of stream) {
      if (chunk.type === 'audio' && chunk.data) {
        chunks.push(chunk.data);
      }
    }

    const audioBuffer = Buffer.concat(chunks);

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('[API /api/tts Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'edge-tts processing failed' },
      { status: 500 },
    );
  }
}
