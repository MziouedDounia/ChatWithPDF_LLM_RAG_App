import React, { useState, useEffect, useCallback } from "react";

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
    // Add more mappings as needed

};

export default function BotMessage({ fetchMessage }) {
  const [isLoading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", language: "" });
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    if (!isLoading && message.text && selectedVoice) {
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(message.text);
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [isLoading, message.text, selectedVoice]);

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