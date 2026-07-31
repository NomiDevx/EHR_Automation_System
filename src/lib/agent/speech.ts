/* eslint-disable @typescript-eslint/no-explicit-any */

type SpeechRecognitionResultEvent = {
  results: { [index: number]: { [index: number]: { transcript: string } } };
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export interface SpeechRecognitionController {
  start: () => void;
  stop: () => void;
  isSupported: boolean;
}

export function createSpeechRecognition(
  onResult: (transcript: string) => void,
  onError: (message: string) => void,
  onEnd: () => void,
  onInterimResult?: (interimTranscript: string) => void,
): SpeechRecognitionController {
  const SpeechRecognitionClass = getSpeechRecognitionConstructor();

  if (!SpeechRecognitionClass) {
    return {
      isSupported: false,
      start: () => {},
      stop: () => {},
    };
  }

  const recognition = new SpeechRecognitionClass();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event: SpeechRecognitionResultEvent) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = 0; i < (event.results as any).length; i++) {
      const res = (event.results as any)[i];
      const text = res[0]?.transcript || '';
      if (res.isFinal) {
        finalTranscript += text;
      } else {
        interimTranscript += text;
      }
    }

    if (interimTranscript && onInterimResult) {
      onInterimResult(interimTranscript);
    }

    if (finalTranscript.trim()) {
      onResult(finalTranscript.trim());
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
    if (event.error === 'aborted') return;

    const errorMessages: Record<string, string> = {
      'not-allowed':       'Microphone access was denied. Please click the 🔒 icon in your browser address bar and allow microphone access.',
      'audio-capture':     'No microphone was found. Please check that a microphone is connected and try again.',
      'network':           'Voice recognition needs an internet connection to Google\'s servers. Please type your message instead.',
      'service-not-allowed': 'Voice input is not allowed on this page. Try opening the page in Chrome.',
      'no-speech':         'No speech was detected. Please speak clearly and try again.',
      'bad-grammar':       'Could not understand the speech format. Please try again.',
      'language-not-supported': 'Your browser does not support voice input in this language.',
    };

    onError(errorMessages[event.error] ?? `Voice input failed (${event.error}). Please type your message.`);
  };

  recognition.onend = onEnd;

  return {
    isSupported: true,
    start: () => recognition.start(),
    stop: () => recognition.abort(),
  };
}

function getBestFemaleVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Priority order for natural human female voices across browsers (Chrome, Edge, Safari, Windows, macOS)
  const preferredFemaleVoiceNames = [
    'Microsoft Aria Online (Natural)',
    'Microsoft Jenny Online (Natural)',
    'Google US English',
    'Google UK English Female',
    'Microsoft Zira',
    'Microsoft Eva',
    'Samantha',
    'Victoria',
    'Karen',
    'Fiona',
    'Moira',
    'Serena',
  ];

  // 1. Check priority list
  for (const name of preferredFemaleVoiceNames) {
    const match = voices.find((v) => v.name.includes(name));
    if (match) return match;
  }

  // 2. Check any English voice with female indicators
  const femaleFallback = voices.find(
    (v) =>
      v.lang.startsWith('en') &&
      (v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('zira') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('aria') ||
        v.name.toLowerCase().includes('jenny'))
  );
  if (femaleFallback) return femaleFallback;

  // 3. Any English voice fallback
  return voices.find((v) => v.lang.startsWith('en')) || voices[0] || null;
}

// Preload voices in browsers that load them asynchronously
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    getBestFemaleVoice();
  };
}

let activeAudioPlayer: HTMLAudioElement | null = null;

export function speak(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
): void {
  if (!text.trim()) {
    return;
  }

  // Stop any currently playing audio or browser speech synthesis
  stopSpeaking();

  // Clean text for natural speech synthesis (remove markdown formatting, bracket IDs, emojis)
  const cleanText = text
    .replace(/\[ID:[^\]]+\]/g, '')
    .replace(/[*#_~`]/g, '')
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    .replace(/\n+/g, '. ')
    .trim();

  // Try ElevenLabs audio endpoint from FastAPI backend first
  const agentApiUrl = process.env.NEXT_PUBLIC_AGENT_API_URL;
  if (agentApiUrl && typeof window !== 'undefined') {
    const baseUrl = agentApiUrl.replace(/\/$/, '');
    
    fetch(`${baseUrl}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText }),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('ElevenLabs TTS unavailable, fallback to WebSpeech');
        }
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        activeAudioPlayer = audio;

        if (onStart) onStart();

        audio.onended = () => {
          activeAudioPlayer = null;
          URL.revokeObjectURL(audioUrl);
          if (onEnd) onEnd();
        };

        audio.onerror = () => {
          activeAudioPlayer = null;
          URL.revokeObjectURL(audioUrl);
          if (onEnd) onEnd();
        };

        await audio.play();
      })
      .catch(() => {
        // Fallback to browser Web Speech API
        speakWithBrowserSpeech(cleanText, onStart, onEnd);
      });

    return;
  }

  speakWithBrowserSpeech(cleanText, onStart, onEnd);
}

function speakWithBrowserSpeech(
  cleanText: string,
  onStart?: () => void,
  onEnd?: () => void,
): void {
  if (!isSpeechSynthesisSupported()) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(cleanText);

  // Set warm human female voice
  const femaleVoice = getBestFemaleVoice();
  if (femaleVoice) {
    utterance.voice = femaleVoice;
  }

  utterance.rate = 0.92; // Calm, clear pace for senior citizens
  utterance.pitch = 1.05; // Natural warm female pitch
  utterance.volume = 1;

  if (onStart) utterance.onstart = onStart;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (activeAudioPlayer) {
    activeAudioPlayer.pause();
    activeAudioPlayer.currentTime = 0;
    activeAudioPlayer = null;
  }

  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  const isAudioActive = activeAudioPlayer !== null && !activeAudioPlayer.paused;
  const isWebSpeechActive = isSpeechSynthesisSupported() && window.speechSynthesis.speaking;
  return isAudioActive || isWebSpeechActive;
}
