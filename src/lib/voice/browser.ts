/**
 * Browser belt — Web Speech mouth + ears. Free, on-device, no key, no server.
 * The guaranteed-available floor: every premium belt/slot degrades to this so
 * the traveler is never left mute or deaf. Wraps the existing src/lib/voice.ts
 * (mouth) and mirrors src/lib/useSpeech.ts's core (ears) without the React hook,
 * so the belt is usable outside a component.
 */
import { speak as webSpeak, stopSpeaking, speechOutputSupported } from "../voice";
import type { Mouth, Ears, EarsHandlers } from "./types";

const LANG_TAG: Record<string, string> = {
  en: "en-US", es: "es-ES", ar: "ar-SA", zh: "zh-CN", fr: "fr-FR",
  de: "de-DE", pt: "pt-PT", ja: "ja-JP", ko: "ko-KR",
};

export const browserMouth: Mouth = {
  name: "browser-webspeech",
  speak(text, opts) {
    opts?.onStart?.();
    webSpeak(text, opts?.locale ?? "en");
    // Web Speech exposes utterance.onend; the existing helper fires-and-forgets,
    // so onEnd is best-effort here. The premium mouths wire real end events.
    opts?.onEnd?.();
  },
  stop() { stopSpeaking(); },
  supported: () => speechOutputSupported(),
};

interface SpeechAlt { transcript: string }
interface SpeechResult { 0: SpeechAlt }
interface SpeechEvent { results: ArrayLike<SpeechResult> }
interface Recognition {
  continuous: boolean; interimResults: boolean; lang: string;
  onresult: ((e: SpeechEvent) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export const browserEars: Ears = (() => {
  let rec: Recognition | null = null;
  return {
    name: "browser-webspeech",
    supported: () => recognitionCtor() !== null,
    start(handlers: EarsHandlers, locale = "en") {
      const Ctor = recognitionCtor();
      if (!Ctor) { handlers.onError?.(new Error("speech recognition unsupported")); return; }
      rec = new Ctor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = LANG_TAG[locale] || "en-US";
      let finalText = "";
      rec.onresult = (e) => {
        let t = "";
        for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
        finalText = t;
        handlers.onPartial?.(t);
      };
      rec.onerror = (err) => handlers.onError?.(err);
      rec.onend = () => { handlers.onFinal?.(finalText); handlers.onEnd?.(); };
      rec.start();
    },
    stop() { try { rec?.stop(); } catch { /* noop */ } },
  };
})();
