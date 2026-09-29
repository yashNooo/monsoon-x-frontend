import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, type LiveServerMessage } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/live' });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY || '';
const hasGeminiKey = Boolean(apiKey && apiKey.trim() !== '');

// Initialize Gemini SDK if API key is present
const ai = hasGeminiKey ? new GoogleGenAI({ apiKey }) : null;

// Helper to build intelligent context-aware fallback response in Demo Mode
const generateSmartLocalAdvice = (
  message: string,
  location: any,
  crop: any,
  weatherSummary: any,
  assessment: any
) => {
  const query = message.toLowerCase();
  const cropName = crop?.name || 'Bajra';
  const cropLocal = crop?.localName || 'बाजरा';
  const blockName = location?.block || 'Sanganer';
  const rain7d = weatherSummary?.totalRainfall7dMm ?? 35;
  const onset = assessment?.onsetProbability ?? 50;
  const falseOnset = assessment?.falseOnsetRisk ?? 60;
  const breakRisk = assessment?.breakRisk ?? 35;
  const bestDec = assessment?.bestDecision || 'Wait 7 Days';
  const bestDecHi = assessment?.bestDecisionHi || '7 दिन प्रतीक्षा करें';

  if (query.includes('sow') || query.includes('बोना') || query.includes('बुवाई') || query.includes('today') || query.includes('आज')) {
    return {
      text: `Based on hyperlocal agro-meteorological modeling for **${blockName} Block**:\n\n` +
        `• **Current Recommendation**: **${bestDec}** (${bestDecHi}) for **${cropLocal} (${cropName})**.\n` +
        `• **Monsoon Onset Probability**: ${onset}%\n` +
        `• **False Onset Risk**: ${falseOnset}%\n` +
        `• **Dry Break Risk**: ${breakRisk}%\n` +
        `• **Expected 7-Day Rainfall**: ${rain7d} mm (Crop Requirement: ${crop?.minimumRainfallMm || 25} mm).\n\n` +
        `*Agronomic Advice (सलाह)*: ${assessment?.advisoryHi || 'मिट्टी में पर्याप्त नमी की पुष्टि के बाद ही बुवाई करें।'}`,
      isFallback: true
    };
  }

  if (query.includes('false onset') || query.includes('नकली') || query.includes('fake')) {
    return {
      text: `**False Onset Diagnostic for ${blockName} Block**:\n\n` +
        `Current False Onset Risk is **${falseOnset}%**.\n\n` +
        `A False Onset occurs when early convective showers encourage sowing, but are immediately followed by 5–7 hot, dry days. This desiccates ${cropLocal} seeds before roots reach subsoil moisture.\n\n` +
        `*Action*: ${falseOnset >= 50 ? 'Wait 7 days for sustained monsoon synoptic currents before planting.' : 'Follow-up rain looks steady; low threat of seed drying.'}`,
      isFallback: true
    };
  }

  if (query.includes('rain') || query.includes('barish') || query.includes('बारिश') || query.includes('weather') || query.includes('मौसम')) {
    return {
      text: `**Weather & Rain Summary for ${blockName} Block**:\n\n` +
        `• **7-Day Cumulative Rain**: ${rain7d} mm\n` +
        `• **Peak 24h Shower**: ${weatherSummary?.maxSingleDayRainMm ?? 18} mm\n` +
        `• **Consecutive Dry Gap**: ${weatherSummary?.maxDrySpellGapDays ?? 4} days\n` +
        `• **Sowing Viability for ${cropLocal}**: ${rain7d >= (crop?.minimumRainfallMm || 25) ? 'Adequate moisture threshold met.' : 'Moisture deficit; delay sowing.'}`,
      isFallback: true
    };
  }

  return {
    text: `नमस्ते! I am your Monsoon-X Agro-Climatic Assistant for **${blockName} Block**.\n\n` +
      `You are currently analyzing **${cropLocal} (${cropName})**.\n` +
      `• Optimal Decision: **${bestDec}** (${bestDecHi})\n` +
      `• Onset Probability: **${onset}%** | False Onset Hazard: **${falseOnset}%**\n` +
      `• 7-Day Predicted Rain: **${rain7d} mm**\n\n` +
      `Feel free to ask in Hindi or English: "क्या आज बुवाई करें?", "How high is the dry spell risk?", or "What is the best sowing depth?"`,
    isFallback: true
  };
};

// 1. Text & Conversational Chat Endpoint (Powered by gemini-3.8-flash)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, location, crop, weatherSummary, assessment, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // If Gemini API Key is missing, respond with high-precision agronomic fallback
    if (!hasGeminiKey || !ai) {
      const fallback = generateSmartLocalAdvice(message, location, crop, weatherSummary, assessment);
      return res.json({
        reply: fallback.text,
        model: 'monsoonx-agro-engine (Demo)',
        isDemo: true,
      });
    }

    const systemInstruction = `
You are MONSOON-X, a distinguished Indian Agro-Meteorological Scientist and Hyperlocal Farm Advisory Assistant.
Your mission is to help farmers make optimal, risk-calibrated sowing and water management decisions.

Current Farm Context:
- Location: ${location?.name || 'Jaipur Grid'}
- Administrative: Block: ${location?.block || 'Sanganer'}, Panchayat: ${location?.panchayat || 'Central'}, District: ${location?.district || 'Jaipur'}, State: ${location?.state || 'Rajasthan'}
- Geographic Coordinates: Latitude ${location?.latitude?.toFixed(4)}, Longitude ${location?.longitude?.toFixed(4)}
- Selected Crop: ${crop?.name || 'Bajra'} (${crop?.localName || 'बाजरा'})
- Crop Moisture Threshold: ${crop?.minimumRainfallMm || 25} mm minimum rainfall before sowing
- Crop Drought Tolerance: ${crop?.drySpellToleranceDays || 14} consecutive dry days maximum
- Sowing Notes: ${crop?.sowingNotes || 'Drought tolerant Kharif crop.'}

Live Meteorological & Hybrid Risk Metrics:
- 7-Day Cumulative Rainfall: ${weatherSummary?.totalRainfall7dMm ?? 'N/A'} mm
- Rainy Days Count: ${weatherSummary?.rainyDays7d ?? 'N/A'} of 7 days
- Peak Single-Day Rain: ${weatherSummary?.maxSingleDayRainMm ?? 'N/A'} mm
- Longest Predicted Dry Gap: ${assessment?.longestDryGapDays ?? weatherSummary?.maxDrySpellGapDays ?? 'N/A'} days
- Monsoon Onset Probability: ${assessment?.onsetProbability ?? 50}%
- False Onset Risk: ${assessment?.falseOnsetRisk ?? 60}%
- Monsoon Break Risk: ${assessment?.breakRisk ?? 35}%
- Heavy Rain / Flood Risk: ${assessment?.heavyRainRisk ?? 15}%
- Computed Best Sowing Decision: ${assessment?.bestDecision || 'Wait 7 Days'} (${assessment?.bestDecisionHi || '7 दिन प्रतीक्षा करें'})
- Primary Hindi Advisory: "${assessment?.advisoryHi || ''}"

Guidelines:
1. Ground your answers directly in the farmer's location, crop thresholds, and risk percentages above.
2. If asked in Hindi, respond primarily in clear, natural Hindi (Devanagari script) with key terms. If asked in English, respond in clear English with Hindi crop names in parentheses.
3. Be direct, authoritative, yet warm and encouraging to farmers.
4. Keep answers concise, actionable, and structured with bullet points.
5. Emphasize that advisories are probabilistic decisions, not unconditional guarantees.
`.trim();

    // Format chat contents
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    const replyText = response.text || 'Unable to generate response at this time.';
    res.json({
      reply: replyText,
      model: 'gemini-3.8-flash',
      isDemo: false,
    });
  } catch (err: any) {
    console.error('Gemini chat error:', err);
    // Graceful fallback on API error
    const { message, location, crop, weatherSummary, assessment } = req.body;
    const fallback = generateSmartLocalAdvice(message, location, crop, weatherSummary, assessment);
    res.json({
      reply: fallback.text,
      model: 'monsoonx-agro-engine (Fallback)',
      isDemo: true,
      errorNotice: err?.message,
    });
  }
});

// 2. Text-to-Speech Endpoint (Powered by gemini-3.8-flash-lite-tts)
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Kore' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    if (!hasGeminiKey || !ai) {
      return res.json({ audio: null, useBrowserSpeech: true });
    }

    const cleanText = text.replace(/[*#_`]/g, '').slice(0, 500);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: cleanText }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (audioData) {
      return res.json({ audio: audioData, mimeType: 'audio/pcm;rate=24000' });
    }

    res.json({ audio: null, useBrowserSpeech: true });
  } catch (err) {
    console.warn('Gemini TTS error, falling back to client browser synthesis:', err);
    res.json({ audio: null, useBrowserSpeech: true });
  }
});

// 3. Real-time Live Voice Conversation WebSocket (/live via gemini-3.8-live)
wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to Live API WebSocket');

  if (!hasGeminiKey || !ai) {
    clientWs.send(JSON.stringify({
      error: 'GEMINI_API_KEY is not configured on server. Live API requires Gemini API credentials.',
      isDemo: true
    }));
    clientWs.close();
    return;
  }

  let session: any = null;

  try {
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: `You are MONSOON-X, a voice-first real-time agricultural monsoon advisory assistant for Indian farmers. Speak concisely in helpful, warm language (Hindi or English according to the farmer). Give actionable sowing, false onset, and rainfall advice. Keep voice answers brief and conversational.`
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio) {
            clientWs.send(JSON.stringify({ audio }));
          }
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
        },
        onclose: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ closed: true }));
          }
        }
      }
    });

    clientWs.on('message', (data: any) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio && session) {
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' }
          });
        }
        if (parsed.text && session) {
          session.sendRealtimeInput({
            text: parsed.text
          });
        }
      } catch (e) {
        console.error('Error forwarding message to Live session:', e);
      }
    });

    clientWs.on('close', () => {
      try {
        if (session && typeof session.close === 'function') {
          session.close();
        }
      } catch {
        // ignore
      }
    });
  } catch (err: any) {
    console.error('Live connect error:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ error: err?.message || 'Failed to start Live API session' }));
      clientWs.close();
    }
  }
});

// Vite middleware integration
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Monsoon-X Full-Stack server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
