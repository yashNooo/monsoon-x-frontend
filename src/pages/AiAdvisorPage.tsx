import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  MapPin, 
  Radio, 
  Compass, 
  ArrowRight 
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
import { Link } from 'react-router-dom';

export const AiAdvisorPage = () => {
  const { 
    block, 
    panchayat, 
    district, 
    state, 
    latitude, 
    longitude, 
    locationName, 
    selectedCropId, 
    setSelectedCropId,
    savedFarms,
    activeFarmId,
    selectSavedFarm
  } = useLocation();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [liveModeActive, setLiveModeActive] = useState(false);
  const [liveStatusText, setLiveStatusText] = useState<string>('');
  const [riskMetrics, setRiskMetrics] = useState<{
    onset: number;
    falseOnset: number;
    breakRisk: number;
    decision: string;
    decisionHi: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const liveWsRef = useRef<WebSocket | null>(null);
  const liveAudioCtxRef = useRef<AudioContext | null>(null);

  const activeCrop = CROPS_CATALOG.find(c => c.id === selectedCropId) || CROPS_CATALOG[0];

  // Fetch quick metrics for the context card
  useEffect(() => {
    const fetchQuickMetrics = async () => {
      try {
        const weather = await fetchWeatherForecast(latitude, longitude);
        const assessment = computeHybridRisk(weather, activeCrop, 14);
        setRiskMetrics({
          onset: assessment.onsetProbability,
          falseOnset: assessment.falseOnsetRisk,
          breakRisk: assessment.breakRisk,
          decision: assessment.bestDecision,
          decisionHi: assessment.bestDecisionHi,
        });
      } catch (e) {
        console.warn('Quick metrics error:', e);
      }
    };
    fetchQuickMetrics();
  }, [latitude, longitude, selectedCropId]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome_page',
          role: 'assistant',
          text: `नमस्ते! I am your **MONSOON-X AI Agro Advisor** powered by **Gemini 3.8**.\n\n` +
            `I have synchronized your active farm location in **${block} Block (${panchayat})** and current crop selection **${activeCrop.localName} (${activeCrop.name})**.\n\n` +
            `You can type or click the microphone to ask questions in Hindi or English about:\n` +
            `• Sowing timing & false onset threats\n` +
            `• 7–14 day rainfall probability\n` +
            `• Root-zone moisture and drought breaks`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [block, panchayat, activeCrop]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (!recognitionRef.current) {
        alert('Voice input is not supported in this browser.');
        return;
      }
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
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
      id: `user_${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
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

      const res = await sendGeminiChat(query, contextPayload);

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          role: 'assistant',
          text: `Error contacting advisory service: ${err?.message || 'Network issue'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
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

  const toggleLiveVoiceMode = async () => {
    if (liveModeActive) {
      liveWsRef.current?.close();
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
        setLiveStatusText('Live Session Active · Speak anytime');
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
          setLiveStatusText(`Microphone error: ${err?.message}`);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            setLiveStatusText(`Live Notice: ${data.error}`);
            return;
          }
          if (data.audio) {
            setLiveStatusText('Gemini Live is speaking...');
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        setLiveStatusText('Live session disconnected');
        setLiveModeActive(false);
      };
    } catch (err: any) {
      setLiveStatusText(`Live connect failed: ${err?.message}`);
      setLiveModeActive(false);
    }
  };

  const quickPrompts = [
    `क्या इस सप्ताह ${activeCrop.localName} बोना सही रहेगा?`,
    `What is the false onset risk in ${block} right now?`,
    `How much rain is expected in ${block} over the next 7 days?`,
    `What should I do if a 7-day dry break happens after sowing?`,
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 border-l-4 border-l-primary flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="heading-primary text-2xl font-bold">
              Gemini Agro-Climatic Voice &amp; Chat Advisor
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/40 font-bold uppercase">
              Gemini 3.8
            </span>
          </div>
          <p className="subheading text-xs sm:text-sm max-w-2xl">
            Location-grounded agricultural advisor answering questions according to your farm&rsquo;s coordinates, crop requirements, and live monsoon risks.
          </p>
        </div>

        {/* Live Voice API Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleLiveVoiceMode}
            className={`btn-primary py-2 px-3.5 text-xs font-semibold flex items-center gap-2 ${
              liveModeActive ? 'bg-rose-500 hover:bg-rose-600 animate-pulse' : ''
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>{liveModeActive ? 'End Live Voice Call' : 'Start Live Voice Call (Gemini 3.8 Live)'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Context Sidebar, Right Chat Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left Column: Context Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-panelBorder/50 pb-2">
              <span className="text-xs uppercase font-mono text-primary font-bold flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" /> Farm Context
              </span>
              <Link to="/map" className="text-[11px] text-textMuted hover:text-white flex items-center gap-0.5">
                Map <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Farm and Location selector */}
            <div className="space-y-2 text-xs">
              {savedFarms.length > 0 && (
                <div>
                  <label className="text-[10px] text-textMuted uppercase font-semibold block mb-1">
                    Select Farm Plot:
                  </label>
                  <select
                    value={activeFarmId || ''}
                    onChange={(e) => {
                      if (e.target.value) selectSavedFarm(e.target.value);
                    }}
                    className="w-full bg-background border border-panelBorder rounded-lg p-2 text-xs text-textMain focus:outline-none focus:border-primary"
                  >
                    {savedFarms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="p-2.5 rounded-lg bg-background/60 border border-panelBorder/40 space-y-1">
                <div className="flex items-center gap-1 font-semibold text-textMain">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>{block} Block</span>
                </div>
                <div className="text-[11px] text-textMuted">
                  {panchayat} Panchayat &middot; {district}, {state}
                </div>
                <div className="text-[10px] text-textMuted font-mono">
                  {latitude.toFixed(3)}°N, {longitude.toFixed(3)}°E
                </div>
              </div>
            </div>

            {/* Target Crop Selector */}
            <div className="space-y-1 text-xs pt-1">
              <label className="text-[10px] text-textMuted uppercase font-semibold block">
                Target Crop:
              </label>
              <select
                value={selectedCropId}
                onChange={(e) => setSelectedCropId(e.target.value)}
                className="w-full bg-background border border-panelBorder rounded-lg p-2 text-xs text-textMain font-bold focus:outline-none focus:border-primary"
              >
                {CROPS_CATALOG.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.localName} ({c.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Live Risk Badges */}
            {riskMetrics && (
              <div className="space-y-2 pt-2 border-t border-panelBorder/40 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-textMuted">Onset Prob:</span>
                  <span className="font-bold text-emerald-400">{riskMetrics.onset}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-textMuted">False Onset:</span>
                  <span className={`font-bold ${riskMetrics.falseOnset >= 50 ? 'text-rose-400' : 'text-textMain'}`}>
                    {riskMetrics.falseOnset}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-textMuted">Break Risk:</span>
                  <span className="font-bold text-amber-400">{riskMetrics.breakRisk}%</span>
                </div>
                <div className="p-2 rounded bg-primary/10 border border-primary/20 text-center font-bold text-primary text-[11px] mt-2">
                  Strategy: {riskMetrics.decisionHi}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chat Stream & Voice Controls */}
        <div className="lg:col-span-3 glass-panel p-4 flex flex-col h-[620px]">
          {/* Live Call Banner if active */}
          {liveModeActive && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-lg text-xs text-rose-300 flex items-center justify-between mb-3 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="font-semibold">{liveStatusText}</span>
              </div>
              <button
                onClick={toggleLiveVoiceMode}
                className="text-[11px] font-bold text-rose-400 hover:underline uppercase"
              >
                Disconnect
              </button>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isPlaying = playingMessageId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed text-xs sm:text-sm ${
                      isUser
                        ? 'bg-primary text-white rounded-br-none shadow-md shadow-primary/20'
                        : 'bg-panel border border-panelBorder text-textMain rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {!isUser && (
                      <div className="mt-2.5 pt-2 border-t border-panelBorder/40 flex items-center justify-between text-[11px] text-textMuted">
                        <button
                          onClick={() => handlePlayAudio(msg.id, msg.text)}
                          className="flex items-center gap-1.5 text-primary hover:text-white transition-colors"
                        >
                          {isPlaying ? (
                            <>
                              <VolumeX className="w-4 h-4 text-rose-400 animate-pulse" />
                              <span className="text-rose-400 font-semibold">Stop Voice</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-4 h-4" />
                              <span>Listen to Advice (आवाज सुनें)</span>
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
                <span>Consulting Gemini agro-meteorological model...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-panelBorder/30">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                disabled={isLoading}
                className="whitespace-nowrap bg-background hover:bg-panel border border-panelBorder/70 text-[11px] text-textMuted hover:text-white px-3 py-1 rounded-full transition-colors shrink-0"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Form with Microphone */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 pt-2 border-t border-panelBorder/40"
          >
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`p-3 rounded-lg border transition-all shrink-0 ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                  : 'bg-background border-panelBorder text-primary hover:text-white hover:bg-panel'
              }`}
              title={isListening ? 'Stop Recording' : 'Speak Question in Hindi or English'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? 'Listening... बोलिए...' : `Ask anything about ${activeCrop.localName} in ${block}...`}
              disabled={isLoading}
              className="flex-1 bg-background border border-panelBorder rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-textMain placeholder-textMuted/60 focus:outline-none focus:border-primary"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="btn-primary py-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 shrink-0"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AiAdvisorPage;
