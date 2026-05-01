import { useCallback } from 'react';

export const useVoice = () => {
  const speak = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1;
    utt.pitch = 1;
    window.speechSynthesis.speak(utt);
  }, []);

  const listen = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        reject(new Error('Speech recognition not supported'));
        return;
      }
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SR();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (e) => resolve(e.results[0][0].transcript);
      recognition.onerror  = (e) => reject(e.error);
      recognition.start();
    });
  }, []);

  return { speak, listen };
};
