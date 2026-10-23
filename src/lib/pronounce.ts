import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { isNative } from './runtime';

/* Word pronunciation, always in an English voice.

   On a Turkish phone the default voice is Turkish, and a Turkish voice reads an English
   word letter by letter as it is written ("watch" -> "vatç"). So:
   - in the app the phone's own text-to-speech engine is asked for en-US explicitly;
   - in the browser an English voice is picked by hand (setting `lang` alone is not
     enough on many devices).
   Dictionary notes are not read aloud: "different (from)" is said as "different from",
   "chat / chit-chat" as "chat, chit-chat". */

export function speakable(word: string): string {
  return word
    .replace(/\\/g, '')
    .replace(/[()[\]{}]/g, ' ')
    .replace(/\s*\/\s*/g, ', ')
    .replace(/\b(sth|smth)\b\.?/gi, 'something')
    .replace(/\b(sb|smb)\b\.?/gi, 'somebody')
    .replace(/\s+/g, ' ')
    .trim();
}

let englishVoice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (englishVoice) return englishVoice;
  const voices = window.speechSynthesis.getVoices();
  const en = voices.filter(v => /^en[-_]/i.test(v.lang) || v.lang.toLowerCase() === 'en');
  englishVoice =
    en.find(v => /^en[-_]US$/i.test(v.lang) && v.localService) ||
    en.find(v => /^en[-_]US$/i.test(v.lang)) ||
    en.find(v => /^en[-_]GB$/i.test(v.lang)) ||
    en[0] ||
    null;
  return englishVoice;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  // Voices arrive asynchronously in Chrome.
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    englishVoice = null;
    pickVoice();
  });
}

export function stopPronunciation() {
  if (isNative) void TextToSpeech.stop().catch(() => {});
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}

export function pronounce(word: string, rate = 0.85) {
  const text = speakable(word);
  if (!text) return;

  if (isNative) {
    // Android/iOS: the system engine with an explicit English language.
    void TextToSpeech.speak({ text, lang: 'en-US', rate: Math.min(1, rate + 0.05), pitch: 1, volume: 1 }).catch(() =>
      speakInBrowser(text, rate)
    );
    return;
  }
  speakInBrowser(text, rate);
}

function speakInBrowser(text: string, rate: number) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  const voice = pickVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}
