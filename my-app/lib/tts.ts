import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

export async function speak(text: string) {
  try {
    if (Capacitor.isNativePlatform()) {
      // ✅ APK — use native TTS
      await TextToSpeech.speak({
        text: text,
        lang: 'hi-IN',       // Hindi
        rate: 0.9,
        pitch: 1.0,
        volume: 1.0,
        category: 'ambient',
      });
    } else {
      // ✅ Browser — use Web Speech API
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.9;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  } catch (error) {
    console.error('TTS error:', error);
  }
}

export async function stopSpeaking() {
  try {
    if (Capacitor.isNativePlatform()) {
      await TextToSpeech.stop();
    } else {
      window.speechSynthesis.cancel();
    }
  } catch (error) {
    console.error('TTS stop error:', error);
  }
}