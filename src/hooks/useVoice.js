import { useCallback } from 'react';

export const useVoice = () => {
  const speak = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1;
    utt.pitch = 1;

    // Wait for voices to load (needed on first call)
    const setVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find(v => v.lang.startsWith('en') && /female|zira|susan|karen|samantha/i.test(v.name)) ||
        voices.find(v => v.lang === 'en-US') ||
        voices.find(v => v.lang.startsWith('en')) ||
        null;
      if (preferred) utt.voice = preferred;
      window.speechSynthesis.speak(utt);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      setVoiceAndSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
    }
  }, []);

  /**
   * @param {number}   timeoutMs      - How long to wait for speech before giving up (default 10s)
   * @param {Function} onSpeechStart  - Called the moment Chrome detects the user started speaking
   */
  const listen = useCallback((timeoutMs = 10000, onSpeechStart) => {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        reject(new Error('Speech recognition is not supported in this browser. Please use Chrome.'));
        return;
      }

      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SR();
      recognition.lang = 'en-US';
      recognition.interimResults = false; // we only want the final result
      recognition.maxAlternatives = 1;
      recognition.continuous = false;    // stop after one utterance

      let resolved = false;
      let rejected = false;

      // Safe wrappers — only the first call wins
      const safeResolve = (val) => {
        if (resolved || rejected) return;
        resolved = true;
        clearTimeout(timer);
        resolve(val);
        // Do NOT call recognition.stop() here — Chrome may not have delivered
        // onresult yet if we race it; just let the session end naturally.
      };

      const safeReject = (err) => {
        if (resolved || rejected) return;
        rejected = true;
        clearTimeout(timer);
        try { recognition.abort(); } catch (_) { /* ignore */ }
        reject(err);
      };

      // Hard-timeout in case Chrome never fires onresult OR onend
      const timer = setTimeout(() => {
        safeReject(new Error('Listening timed out. Please try again and speak clearly.'));
      }, timeoutMs);

      // ── Event handlers ───────────────────────────────────────────

      // Fires the moment the engine starts capturing audio (mic open)
      recognition.onaudiostart = () => {
        // mic is open — caller can show "Listening..." here
      };

      // Fires the moment Chrome detects the START of speech
      recognition.onspeechstart = () => {
        if (typeof onSpeechStart === 'function') onSpeechStart();
      };

      // The real result — this is what we want
      recognition.onresult = (e) => {
        const transcript = e.results?.[0]?.[0]?.transcript?.trim();
        if (transcript) {
          safeResolve(transcript);
        } else {
          safeReject(new Error('Could not understand speech. Please speak clearly and try again.'));
        }
      };

      // Error codes from the browser
      recognition.onerror = (e) => {
        if (e.error === 'aborted') return; // we caused this — ignore it
        const messages = {
          'not-allowed':   'Microphone access denied. Click the 🔒 icon in the address bar and allow microphone.',
          'no-speech':     'No speech detected. Please speak closer to your microphone.',
          'audio-capture': 'No microphone detected. Please connect a microphone and try again.',
          'network':       'Network error. Chrome needs internet to recognise speech.',
          'service-not-allowed': 'Speech service not allowed. Try refreshing the page.',
        };
        safeReject(new Error(messages[e.error] || `Speech recognition error: ${e.error}`));
      };

      // Fires after every session ends (always fires, even on success)
      recognition.onend = () => {
        // If we've already resolved (got a result), do nothing.
        // If we haven't resolved, the session ended without any transcript → error.
        if (!resolved) {
          safeReject(new Error('No speech detected. Please speak clearly into your microphone and try again.'));
        }
      };

      try {
        recognition.start();
      } catch (err) {
        safeReject(new Error('Could not start microphone. Is another tab already using it?'));
      }
    });
  }, []);

  return { speak, listen };
};
