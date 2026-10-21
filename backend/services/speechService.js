// Text-to-Speech Service using Browser Web Speech API

export const speechService = {
  isSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  },

  isSpeaking() {
    if (!this.isSupported()) return false;
    return window.speechSynthesis.speaking;
  },

  speak(text, onEnd, onError) {
    if (!this.isSupported() || !text) return;
    
    // Stop any current utterance
    window.speechSynthesis.cancel();

    // Clean text of markup or excessive symbols
    const cleanText = text.replace(/\[.*?\]/g, '').replace(/[\*_~`]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95; // Clear slightly deliberate pacing for auditorium/projector
    utterance.pitch = 1.0;

    // Pick best English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Enhanced')))) 
      || voices.find(v => v.lang.startsWith('en'));
    
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('TTS error:', e);
      if (onError) onError(e);
    };

    window.speechSynthesis.speak(utterance);
  },

  stop() {
    if (!this.isSupported()) return;
    window.speechSynthesis.cancel();
  }
};
