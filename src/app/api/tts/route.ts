import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { text, voice } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text parameter is required' }, { status: 400 });
    }

    // Default voice: Realistic Microsoft Edge Neural Female Voice ('en-US-AvaNeural')
    const femaleVoice = voice || process.env.EDGE_TTS_VOICE || 'en-US-AvaNeural';

    // Temporary file for generated audio
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `edge_tts_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`);

    // Clean input text for CLI invocation
    const cleanText = text
      .replace(/[\r\n]+/g, ' ')
      .replace(/"/g, '\\"')
      .trim();

    const command = `py -m edge_tts --voice "${femaleVoice}" --text "${cleanText}" --write-media "${tempFile}"`;

    try {
      await execAsync(command, { timeout: 15000 });
    } catch (cmdErr: any) {
      console.warn('[edge-tts py fallback]:', cmdErr?.message);
      const fallbackCmd = `python -m edge_tts --voice "${femaleVoice}" --text "${cleanText}" --write-media "${tempFile}"`;
      await execAsync(fallbackCmd, { timeout: 15000 });
    }

    if (!fs.existsSync(tempFile)) {
      return NextResponse.json({ error: 'Failed to generate edge-tts audio file' }, { status: 500 });
    }

    const audioBuffer = fs.readFileSync(tempFile);

    // Asynchronously delete temp file after reading
    fs.unlink(tempFile, () => {});

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('[API /api/tts Error]:', err);
    return NextResponse.json({ error: 'edge-tts processing failed' }, { status: 500 });
  }
}
