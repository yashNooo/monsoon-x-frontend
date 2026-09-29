import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  MapPin, 
  Minimize2, 
  Radio
} from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { CROPS_CATALOG } from '../data/agriculturalData';
import { fetchWeatherForecast } from '../services/weatherService';
import { computeHybridRisk } from '../services/riskEngine';
import { 
  sendGeminiChat, 
  playAudioResponse, 
  stopAudioResponse, 
  type ChatMessage, 
  type AgroContextPayload 
} from '../services/geminiService';

export const GeminiChatbot: React.FC = () => {
  const { 
    block, 
    panchayat, 
    district, 
    state, 
    latitude, 
    longitude, 
    locationName, 
    selectedCropId, 
    setSelectedCropId 
  } = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [liveModeActive, setLiveModeActive] = useState(false);
  const [liveStatusText, setLiveStatusText] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const liveWsRef = useRef<WebSocket | null>(null);
  const liveAudioCtxRef = useRef<AudioContext | null>(null);

  const activeCrop = CROPS_CATALOG.find(c => c.id === selectedCropId) || CROPS_CATALOG[0];

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Initial welcome message with active context
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'msg_welcome',
          role: 'assistant',
          text: `नमस्ते! I am your **MONSOON-X AI Agro Advisor** for **${block} Block**.\n\n` +
            `I have loaded your live forecast for **${activeCrop.localName} (${activeCrop.name})**.\n\n` +
            `Ask me anything about sowing windows, false onset risks, or soil moisture in English or हिंदी!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [block, activeCrop]);

  // Setup Web Speech Recognition for voice input
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN'; // defaults to Hindi, also recognizes English terms

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition notice:', e.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (!recognitionRef.current) {
        alert('Voice input is not supported by your current browser.');
        return;
      }
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Could not start speech recognition:', err);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    setInputText('');
    stopAudioResponse();
    setPlayingMessageId(null);

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Gather live weather and risk parameters for the current pin & crop
      const weather = await fetchWeatherForecast(latitude, longitude);
      const assessment = computeHybridRisk(weather, activeCrop, 14);

      const contextPayload: AgroContextPayload = {
        location: {
          name: locationName,
          block,
          panchayat,
          district,
          state,
          latitude,
          longitude,
        },
        crop: {
          id: activeCrop.id,
          name: activeCrop.name,
          localName: activeCrop.localName,
          minimumRainfallMm: activeCrop.minimumRainfallMm,
          drySpellToleranceDays: activeCrop.drySpellToleranceDays,
          sowingNotes: activeCrop.sowingNotes,
        },
        weatherSummary: weather.summary,
        assessment: {
          onsetProbability: assessment.onsetProbability,
          falseOnsetRisk: assessment.falseOnsetRisk,
          breakRisk: assessment.breakRisk,
          heavyRainRisk: assessment.heavyRainRisk,
          bestDecision: assessment.bestDecision,
          bestDecisionHi: assessment.bestDecisionHi,
          advisoryHi: assessment.advisoryHi,
          longestDryGapDays: assessment.longestDryGapDays,
        },
        history: messages.slice(-6).map(m => ({ role: m.role, text: m.text })),
      };

      const result = await sendGeminiChat(query, contextPayload);

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        text: result.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Automatically speak short responses if user spoke their input
      if (isListening) {
        handlePlayAudio(aiMsg.id, result.reply);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          role: 'assistant',
          text: `Apologies, unable to process query: ${err?.message || 'Network error'}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAudio = (id: string, text: string) => {
    if (playingMessageId === id) {
      stopAudioResponse();
      setPlayingMessageId(null);
      return;
    }

    stopAudioResponse();
    setPlayingMessageId(id);

    playAudioResponse(
      text,
      () => setPlayingMessageId(id),
      () => setPlayingMessageId(null)
    );
  };

  // Toggle Live API Voice Conversation Mode (gemini-3.8-live)
  const toggleLiveVoiceMode = async () => {
    if (liveModeActive) {
      if (liveWsRef.current) {
        liveWsRef.current.close();
      }
      setLiveModeActive(false);
      setLiveStatusText('');
      return;
    }

    setLiveModeActive(true);
    setLiveStatusText('Connecting to Gemini 3.8 Live API...');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      liveWsRef.current = ws;

      ws.onopen = async () => {
        setLiveStatusText('Live Voice Session Active · Listening...');
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: 16000,
          });
          liveAudioCtxRef.current = audioContext;

          const source = audioContext.createMediaStreamSource(stream);
          const processor = audioContext.createScriptProcessor(4096, 1, 1);
          source.connect(processor);
          processor.connect(audioContext.destination);

          processor.onaudioprocess = (e) => {
            if (ws.readyState === WebSocket.OPEN) {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16Array = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16Array[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
              }
              const binary = String.fromCharCode.apply(null, int16Array as any);
              const base64 = btoa(binary);
              ws.send(JSON.stringify({ audio: base64 }));
            }
          };
        } catch (err: any) {
          setLiveStatusText(`Microphone access error: ${err?.message}`);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            setLiveStatusText(`Live notice: ${data.error}`);
            return;
          }
          if (data.audio) {
            // Play back returned audio chunk from gemini-3.8-live
            setLiveStatusText('Gemini Live is speaking...');
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        setLiveStatusText('Live Voice Session Closed');
        setLiveModeActive(false);
      };
    } catch (err: any) {
      setLiveStatusText(`Failed to connect: ${err?.message}`);
      setLiveModeActive(false);
    }
  };

  const quickPrompts = [
    `क्या आज ${activeCrop.localName} की बुवाई करें?`,
    `Is there a false onset risk in ${block}?`,
    `7-day rainfall forecast for ${block}`,
    `How much moisture does ${activeCrop.name} need?`,
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-sky-500 to-primary text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-2xl shadow-primary/40 hover:scale-105 transition-all flex items-center gap-2.5 border border-white/20 group"
          aria-label="Open Gemini Agro Advisor Chatbot"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-yellow-300 animate-spin-slow" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <span className="hidden sm:inline font-bold text-sm tracking-wide">
            Ask Gemini Advisor
          </span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono hidden md:inline">
            Voice + Chat
          </span>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[440px] h-[580px] max-h-[85vh] glass-panel border border-primary/40 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-panelBorder/40 px-4 py-3 border-b border-panelBorder/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/20 text-primary">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-textMain">Monsoon-X AI Advisor</h3>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-primary/20 text-primary border border-primary/30 uppercase">
                    Gemini 3.8
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-textMuted truncate max-w-[240px]">
                  <MapPin className="w-3 h-3 text-primary shrink-0" />
                  <span>{block} Block</span>
                  <span>&middot;</span>
                  <span className="text-cyan-300 font-semibold">{activeCrop.localName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-textMuted hover:text-white rounded-lg hover:bg-panel transition-colors"
                title="Minimize chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-textMuted hover:text-white rounded-lg hover:bg-panel transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Context Bar (Location & Crop Switcher) */}
          <div className="bg-background/80 px-3.5 py-1.5 border-b border-panelBorder/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-textMuted truncate">
              <span className="text-[10px] uppercase font-bold text-primary">Farm Target:</span>
              <select
                value={selectedCropId}
                onChange={(e) => setSelectedCropId(e.target.value)}
                className="bg-transparent text-textMain font-semibold focus:outline-none cursor-pointer text-xs"
              >
                {CROPS_CATALOG.map((c) => (
                  <option key={c.id} value={c.id} className="bg-background text-textMain">
                    {c.localName} ({c.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Live API Voice Toggle Button */}
            <button
              onClick={toggleLiveVoiceMode}
              className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 border transition-colors ${
                liveModeActive
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse'
                  : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
              }`}
              title="Toggle Gemini 3.8 Live API real-time voice mode"
            >
              <Radio className="w-3 h-3" />
              <span>{liveModeActive ? 'Live Call Active' : 'Live Voice Call'}</span>
            </button>
          </div>

          {/* Live Call Status Banner */}
          {liveModeActive && (
            <div className="bg-rose-500/10 border-b border-rose-500/30 px-3 py-1.5 text-[11px] text-rose-300 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>{liveStatusText}</span>
              </div>
              <button
                onClick={toggleLiveVoiceMode}
                className="text-[10px] text-rose-400 hover:underline uppercase font-bold"
              >
                End Call
              </button>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isPlaying = playingMessageId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                      isUser
                        ? 'bg-primary text-white rounded-br-none shadow-md shadow-primary/20'
                        : 'bg-panel border border-panelBorder/70 text-textMain rounded-bl-none shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {!isUser && (
                      <div className="mt-2 pt-1.5 border-t border-panelBorder/40 flex items-center justify-between text-[10px] text-textMuted">
                        <button
                          onClick={() => handlePlayAudio(msg.id, msg.text)}
                          className="flex items-center gap-1 text-primary hover:text-white transition-colors py-0.5"
                          title="Listen to response (TTS)"
                        >
                          {isPlaying ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                              <span className="text-rose-400">Stop Voice</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Listen (सुनें)</span>
                            </>
                          )}
                        </button>
                        <span>{msg.timestamp}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-textMuted text-xs p-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
                <span>Analyzing {block} forecast &amp; {activeCrop.localName} agronomy...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-3 py-1.5 border-t border-panelBorder/30 bg-background/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="whitespace-nowrap bg-panel hover:bg-panelBorder/50 border border-panelBorder/60 text-[11px] text-textMuted hover:text-white px-2.5 py-1 rounded-full transition-colors shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-panel/90 border-t border-panelBorder/60">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Voice Input Mic Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-2.5 rounded-lg border transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                    : 'bg-background border-panelBorder text-primary hover:text-white hover:bg-panel'
                }`}
                title={isListening ? 'Stop Listening' : 'Speak your question (Hindi / English)'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Text Input Field */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListening ? 'Listening... बोलिए...' : `Ask about ${activeCrop.localName} in ${block}...`}
                disabled={isLoading}
                className="flex-1 bg-background border border-panelBorder rounded-lg px-3 py-2 text-xs text-textMain placeholder-textMuted/60 focus:outline-none focus:border-primary"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="btn-primary p-2.5 rounded-lg text-white disabled:opacity-40"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default GeminiChatbot;
