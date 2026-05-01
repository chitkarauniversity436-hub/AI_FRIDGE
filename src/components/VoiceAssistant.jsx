import React, { useState, useContext } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoice } from '../hooks/useVoice';
import { useAI } from '../hooks/useAI';
import { FridgeContext } from '../context/FridgeContext';

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState('');
  
  const { listen, speak } = useVoice();
  const { state } = useContext(FridgeContext);
  const { askVoice } = useAI(state.settings?.apiKey || '');

  const handleVoiceClick = async () => {
    try {
      setIsListening(true);
      setResponse('Listening...');
      const text = await listen();
      setIsListening(false);
      
      setIsProcessing(true);
      setResponse(`You said: "${text}". Thinking...`);
      
      console.log("Asking AI with key:", state.settings?.apiKey ? "Key Present" : "Key Missing");
      const aiResponse = await askVoice(text, state.inventory);
      
      if (aiResponse) {
        setResponse(aiResponse);
        speak(aiResponse);
      } else {
        const err = state.settings?.apiKey 
          ? "The AI had an error processing that. Check the browser console for details." 
          : "I couldn't process that. Make sure your Gemini API key is set in Settings.";
        setResponse(err);
        speak(err);
      }
    } catch (err) {
      setResponse('Failed to hear you. Check microphone permissions.');
    } finally {
      setIsListening(false);
      setIsProcessing(false);
      setTimeout(() => setResponse(''), 8000); // Hide toast after 8s
    }
  };

  return (
    <>
      <button 
        onClick={handleVoiceClick}
        disabled={isListening || isProcessing}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: isListening ? 'var(--red)' : 'linear-gradient(135deg, var(--primary), var(--secondary))',
          color: '#000',
          border: 'none',
          boxShadow: isListening ? '0 0 20px rgba(239, 68, 68, 0.6)' : '0 10px 25px var(--primary-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1000,
          transition: 'all 0.3s ease'
        }}
      >
        {isProcessing ? <Loader2 size={24} className="spin" /> : isListening ? <Mic size={24} /> : <MicOff size={24} />}
      </button>

      {response && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          right: '30px',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border-color)',
          padding: '16px 20px',
          borderRadius: '12px',
          maxWidth: '300px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          zIndex: 999,
          animation: 'slideUp 0.3s ease',
          lineHeight: '1.4'
        }}>
          {response}
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
