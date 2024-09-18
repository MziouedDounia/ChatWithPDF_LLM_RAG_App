import React, { useState, useEffect, useCallback, useRef } from "react";

const LANGUAGE_MAPPINGS = {
  'eng_Latn': 'en-US',
  'fra_Latn': 'fr-FR',
  'spa_Latn': 'es-ES',
  'deu_Latn': 'de-DE',
  'ita_Latn': 'it-IT',
  'swh_Latn': 'sw',
  'arb_Arab': 'ar-MA',
  'rus_Cyrl': 'ru-RU',
  'zho_Hans': 'zh-CN',
  'zho_Hant': 'zh-TW',
  'jpn_Jpan': 'ja-JP',
  'kor_Hang': 'ko-KR',
  'por_Latn': 'pt-BR',
  'hin_Deva': 'hi-IN',
  'ben_Beng': 'bn-IN',
  'urd_Arab': 'ur-PK',
  'vie_Latn': 'vi-VN',
  'ind_Latn': 'id-ID',
  'tha_Thai': 'th-TH',
  'pol_Latn': 'pl-PL',
  'ukr_Cyrl': 'uk-UA',
  'nld_Latn': 'nl-NL',
  'tur_Latn': 'tr-TR',
};

const phonemeToVisemeMap = {
  B: 'viseme_PP', M: 'viseme_PP', P: 'viseme_PP',
  F: 'viseme_FF', V: 'viseme_FF',
  TH: 'viseme_TH',
  D: 'viseme_DD', T: 'viseme_DD',
  K: 'viseme_kk', G: 'viseme_kk',
  CH: 'viseme_CH', J: 'viseme_CH', SH: 'viseme_CH',
  S: 'viseme_SS', Z: 'viseme_SS',
  N: 'viseme_nn', L: 'viseme_nn',
  R: 'viseme_RR',
  A: 'viseme_aa', E: 'viseme_E', I: 'viseme_I', O: 'viseme_O', U: 'viseme_U',
  '*': 'viseme_sil'
};

function textToPhonemes(text) {
  return text.toUpperCase().split('').map(char => {
    if ('AEIOU'.includes(char)) return char;
    if ('BCDFGHJKLMNPQRSTVWXYZ'.includes(char)) return char;
    return '_';
  });
}

function phonemesToVisemes(phonemes) {
  return phonemes.map(phoneme => phonemeToVisemeMap[phoneme] || 'viseme_sil');
}

export default function BotMessage({ fetchMessage, onVisemeData }) {
  const [isLoading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", language: "" });
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [error, setError] = useState(null);
  const utteranceRef = useRef(null);
  const hasSpokenRef = useRef(false);

  const loadMessage = useCallback(async () => {
    try {
      const msg = await fetchMessage();
      setLoading(false);
      setMessage({
        text: msg.text || "",
        language: msg.language || "eng_Latn"
      });
    } catch (error) {
      console.error("Error fetching message:", error);
      setLoading(false);
      setError("Error fetching message. Please try again.");
      setMessage({ text: "Error fetching message. Please try again", language: "eng_Latn" });
    }
  }, [fetchMessage]);

  useEffect(() => {
    loadMessage();
  }, [loadMessage]);

  useEffect(() => {
    let voiceCheckInterval;

    function updateVoices() {
      if ("speechSynthesis" in window) {
        const voices = window.speechSynthesis.getVoices();
        console.log("All available voices:", voices);
        if (voices.length > 0) {
          setAvailableVoices(voices);
          clearInterval(voiceCheckInterval);
        }
      } else {
        setError("Speech synthesis not supported in this browser.");
        clearInterval(voiceCheckInterval);
      }
    }

    updateVoices();
    voiceCheckInterval = setInterval(updateVoices, 100);

    return () => clearInterval(voiceCheckInterval);
  }, []);

  useEffect(() => {
    function selectVoice(language) {
      const langCode = LANGUAGE_MAPPINGS[language] || language.split('_')[0];
      let voice = availableVoices.find(v => v.lang.startsWith(langCode));

      if (!voice && availableVoices.length > 0) {
        console.warn(`No matching voice found for ${langCode}. Using default voice.`);
        voice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
      }

      setSelectedVoice(voice);
    }

    if (availableVoices.length > 0 && message.language) {
      selectVoice(message.language);
    }
  }, [message.language, availableVoices]);

  const estimateVisemesAndTimings = (text, duration) => {
    const phonemes = textToPhonemes(text);
    const visemes = phonemesToVisemes(phonemes);
    const timings = phonemes.map((_, index) => (index * duration) / phonemes.length);
    return { visemes, timings };
  };

  useEffect(() => {
    if (!isLoading && message.text && selectedVoice && !hasSpokenRef.current) {
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(message.text);
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
        utteranceRef.current = utterance;

        const wordsPerMinute = 160;
        const wordCount = message.text.split(' ').length;
        const estimatedDuration = (wordCount / wordsPerMinute) * 60 * 1000;

        const { visemes, timings } = estimateVisemesAndTimings(message.text, estimatedDuration);

        console.log('Visemes and Timings: ', visemes, timings);

        utterance.onstart = () => {
          console.log("Speech started");
          timings.forEach((timing, index) => {
            setTimeout(() => {
              console.log(`Current Viseme: ${visemes[index]}, Timing: ${timing}ms`);
              onVisemeData(visemes[index], timings[index]);
            }, timing);
          });
        };

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        hasSpokenRef.current = true;
      }
    }
  }, [isLoading, message.text, selectedVoice, onVisemeData]);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="message-container">
      <div className="bot-message">{isLoading ? "..." : message.text}</div>
      <div className="language-info">Detected language: {message.language}</div>
      <div className="voice-info">
        Selected voice: {selectedVoice ? `${selectedVoice.name} (${selectedVoice.lang})` : "None"}
      </div>
      <div className="voice-count">Available voices: {availableVoices.length}</div>
    </div>
  );
}