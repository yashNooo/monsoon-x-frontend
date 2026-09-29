export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isAudioPlaying?: boolean;
}

export interface AgroContextPayload {
  location: {
    name: string;
    block: string;
    panchayat?: string;
    district: string;
    state: string;
    latitude: number;
    longitude: number;
  };
  crop: {
    id: string;
    name: string;
    localName: string;
    minimumRainfallMm: number;
    drySpellToleranceDays: number;
    sowingNotes: string;
  };
  weatherSummary?: {
    totalRainfall7dMm: number;
    totalRainfall14dMm: number;
    rainyDays7d: number;
    maxSingleDayRainMm: number;
    maxDrySpellGapDays: number;
  };
  assessment?: {
    onsetProbability: number;
    falseOnsetRisk: number;
    breakRisk: number;
    heavyRainRisk: number;
    bestDecision: string;
    bestDecisionHi: string;
    advisoryHi: string;
    longestDryGapDays: number;
  };
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
}

export const sendGeminiChat = async (
  message: string,
  context: AgroContextPayload
): Promise<{ reply: string; model: string; isDemo: boolean }> => {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        location: context.location,
        crop: context.crop,
        weatherSummary: context.weatherSummary,
        assessment: context.assessment,
        history: context.history,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return {
      reply: data.reply || 'No response available.',
      model: data.model || 'gemini-3.8-flash',
      isDemo: Boolean(data.isDemo),
    };
  } catch (err: any) {
    console.warn('API chat request failed, generating client-side fallback:', err);
    return {
      reply: `[${context.location.block} Block &middot; ${context.crop.localName}]: Current Monsoon Onset probability is ${context.assessment?.onsetProbability || 50}%. False Onset risk is ${context.assessment?.falseOnsetRisk || 60}%. Recommendation: ${context.assessment?.bestDecision || 'Wait 7 Days'} (${context.assessment?.bestDecisionHi || '7 दिन प्रतीक्षा करें'}).`,
      model: 'local-agro-engine',
      isDemo: true,
    };
  }
};

let audioCtx: AudioContext | null = null;

export const playAudioResponse = async (
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> => {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();

    if (data.audio) {
      // Decode base64 PCM 24kHz audio from gemini-3.8-flash-lite-tts
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
      }
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const binaryString = atob(data.audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 16-bit PCM to Float32
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const buffer = audioCtx.createBuffer(1, float32Array.length, 24000);
      buffer.copyToChannel(float32Array, 0);

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);

      source.onended = () => {
        if (onEnd) onEnd();
      };

      if (onStart) onStart();
      source.start();
      return;
    }
  } catch (err) {
    console.warn('Gemini TTS playback failed, using Web Speech Synthesis fallback:', err);
  }

  // Fallback to browser SpeechSynthesis
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Prefer Hindi voice if available
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.startsWith('hi'));
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      if (onStart) onStart();
    };
    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } else {
    if (onEnd) onEnd();
  }
};

export const stopAudioResponse = (): void => {
  if (audioCtx) {
    try {
      audioCtx.close();
      audioCtx = null;
    } catch {
      // ignore
    }
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
