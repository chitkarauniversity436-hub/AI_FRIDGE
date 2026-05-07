import React, { useState, useContext, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Volume2, X } from 'lucide-react';
import { useVoice } from '../hooks/useVoice';
import { useAI } from '../hooks/useAI';
//hi 
import { FridgeContext } from '../context/FridgeContext';

export default function VoiceAssistant() {
  const [isListening, setIsListening]   = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking]     = useState(false);
  const [status, setStatus]             = useState('');   // short status line
  const [response, setResponse]         = useState('');   // AI reply bubble
  const [errorMsg, setErrorMsg]         = useState('');   // error bubble
  const hideTimer = useRef(null);

  const { listen, speak } = useVoice();
  const { state } = useContext(FridgeContext);

  // Use the dedicated voice key if set; fall back to the main key
  const effectiveKey      = state.settings?.voiceApiKey?.trim() || state.settings?.apiKey?.trim() || '';
  const effectiveProvider = state.settings?.voiceProvider || 'groq';
  const { askVoice } = useAI(effectiveKey);

  // Auto-hide the response/error bubble after 9s
  const scheduleHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setResponse('');
      setErrorMsg('');
      setStatus('');
    }, 9000);
  };

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const showError = (msg) => {
    setErrorMsg(msg);
    setResponse('');
    scheduleHide();
    speak(msg);
  };

  const handleVoiceClick = async () => {
    if (isListening || isProcessing) return;

    setErrorMsg('');
    setResponse('');

    // ── 1. Listen ──────────────────────────────────────────────
    try {
      setIsListening(true);
      setStatus('🎙️ Listening... speak now');

      // onSpeechStart fires the moment Chrome detects your voice
      const onSpeechStart = () => setStatus('✅ Got you! Processing...');

      const text = await listen(10000, onSpeechStart);
      setIsListening(false);
      setStatus(`💬 You said: "${text}"`);

      // ── 2. Ask AI ─────────────────────────────────────────────
      if (!effectiveKey) {
        showError('No API key set. Go to Settings → AI Configuration, choose a Voice Provider and paste your key.');
        setIsListening(false);
        return;
      }

      setIsProcessing(true);
      setStatus('🤔 Thinking...');

      // Build a richer prompt that includes inventory context
      const inventorySnippet = state.inventory.length > 0
        ? `The fridge currently has: ${state.inventory.slice(0, 15).map(i => i.name).join(', ')}.`
        : '';

      const aiPrompt = `${inventorySnippet} The user asked: "${text}". Give a short, helpful, friendly answer in 1–2 sentences.`;

      // askVoice now THROWS on failure — catch it separately so we can
      // show the real error (invalid key, quota exceeded, network, etc.)
      let aiResponse;
      try {
        aiResponse = await askVoice(aiPrompt, effectiveProvider);
      } catch (aiErr) {
        showError(aiErr.message);
        return;
      }

      setResponse(aiResponse);
      setStatus('');
      scheduleHide();
      setIsSpeaking(true);
      speak(aiResponse);
      setTimeout(() => setIsSpeaking(false), 4000);


    } catch (err) {
      setIsListening(false);
      showError(err.message || 'Could not start listening. Check microphone permissions.');
    } finally {
      setIsListening(false);
      setIsProcessing(false);
    }
  };

  const handleDismiss = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setResponse('');
    setErrorMsg('');
    setStatus('');
    if (hideTimer.current) clearTimeout(hideTimer.current);
  };

  // Button appearance
  const btnBg = isListening
    ? '#ef4444'
    : isProcessing
    ? 'linear-gradient(135deg, #f59e0b, #f97316)'
    : isSpeaking
    ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
    : 'linear-gradient(135deg, var(--primary), var(--secondary))';

  const btnShadow = isListening
    ? '0 0 25px rgba(239,68,68,0.7)'
    : isProcessing
    ? '0 0 20px rgba(245,158,11,0.5)'
    : '0 10px 25px var(--primary-glow)';

  return (
    <>
      {/* ── Floating Mic Button ─────────────────────────────────── */}
      <button
        id="voice-assistant-btn"
        onClick={handleVoiceClick}
        disabled={isListening || isProcessing}
        title={
          isListening ? 'Listening...' :
          isProcessing ? 'Processing...' :
          'Ask your fridge anything'
        }
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: btnBg,
          color: '#fff',
          border: 'none',
          boxShadow: btnShadow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isListening || isProcessing ? 'not-allowed' : 'pointer',
          zIndex: 1000,
          transition: 'all 0.3s ease',
          transform: isListening ? 'scale(1.15)' : 'scale(1)',
        }}
      >
        {isProcessing
          ? <Loader2 size={24} className="spin" />
          : isSpeaking
          ? <Volume2 size={24} />
          : isListening
          ? <Mic size={24} />
          : <MicOff size={24} />}
      </button>

      {/* ── Pulse ring while listening ──────────────────────────── */}
      {isListening && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: '3px solid rgba(239,68,68,0.6)',
          animation: 'pulseRing 1.2s ease-out infinite',
          pointerEvents: 'none',
          zIndex: 999,
        }} />
      )}

      {/* ── Status line (small) ─────────────────────────────────── */}
      {status && !response && !errorMsg && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          right: '30px',
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          color: '#fff',
          padding: '10px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          zIndex: 999,
          animation: 'slideUp 0.2s ease',
        }}>
          {status}
        </div>
      )}

      {/* ── AI response bubble ──────────────────────────────────── */}
      {response && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          right: '30px',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-color)',
          padding: '16px 20px',
          borderRadius: '16px',
          maxWidth: '320px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
          zIndex: 999,
          animation: 'slideUp 0.3s ease',
          lineHeight: '1.5',
          fontSize: '14px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '18px' }}>🤖</span>
              <span>{response}</span>
            </div>
            <button onClick={handleDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0', flexShrink: 0 }}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Error bubble ────────────────────────────────────────── */}
      {errorMsg && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          right: '30px',
          background: 'rgba(239,68,68,0.12)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(239,68,68,0.4)',
          padding: '14px 18px',
          borderRadius: '16px',
          maxWidth: '320px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          zIndex: 999,
          animation: 'slideUp 0.3s ease',
          color: '#fca5a5',
          fontSize: '14px',
          lineHeight: '1.5',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <span>{errorMsg}</span>
            </div>
            <button onClick={handleDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', padding: '0', flexShrink: 0 }}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
