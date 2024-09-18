import React, { useState, useEffect, useCallback } from "react";
import ISO6391 from 'iso-639-1';

const LANGUAGE_MAPPINGS = {
  'eng_Latn': 'en',
  'fra_Latn': 'fr',
  'spa_Latn': 'es',
  'deu_Latn': 'de',
  'ita_Latn': 'it',
  'swh_Latn': 'sw',
  'arb_Arab': 'ar',
  'rus_Cyrl': 'ru',
  'zho_Hans': 'zh-CN',
  'zho_Hant': 'zh-TW',
  'jpn_Jpan': 'ja',
  'kor_Hang': 'ko',
  'por_Latn': 'pt',
  'hin_Deva': 'hi',
  'ben_Beng': 'bn',
  'urd_Arab': 'ur',
  'vie_Latn': 'vi',
  'ind_Latn': 'id',
  'tha_Thai': 'th',
  'pol_Latn': 'pl',
  'ukr_Cyrl': 'uk',
  'nld_Latn': 'nl',
  'tur_Latn': 'tr',
  // Add more mappings as needed
};

export default function BotMessage({ fetchMessage }) {
  const [isLoading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", language: "" });
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);

  const loadMessage = useCallback(async () => {
    try {
      const msg = await fetchMessage();
      console.log("Received message:", msg);
      setLoading(false);
      setMessage({
        text: msg.text || "",
        language: msg.language || "eng_Latn"
      });
    } catch (error) {
      console.error("Error fetching message:", error);
      setLoading(false);
      setMessage({ text: "Error fetching message", language: "eng_Latn" });
    }
  }, [fetchMessage]);

  useEffect(() => {
    loadMessage();
  }, [loadMessage]);

  useEffect(() => {
    function updateVoices() {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        console.log("All available voices:", voices);
        
        // Debug information
        const languageCounts = {};
        voices.forEach(voice => {
          const langCode = voice.lang.split('-')[0];
          languageCounts[langCode] = (languageCounts[langCode] || 0) + 1;
        });
        
        console.log("Language distribution:", languageCounts);
        console.log("Total unique languages:", Object.keys(languageCounts).length);
        
        voices.forEach(voice => {
          console.log(`Voice: ${voice.name}, Lang: ${voice.lang}, Default: ${voice.default}`);
        });
      }
    }

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    function selectVoice(language) {
      const isoCode = LANGUAGE_MAPPINGS[language] || language.split('_')[0];
      const languageName = ISO6391.getName(isoCode);
      
      let voice = availableVoices.find(v => 
        v.lang.startsWith(isoCode) || 
        v.name.toLowerCase().includes(languageName.toLowerCase())
      );

      if (!voice && availableVoices.length > 0) {
        console.warn(`No matching voice found for ${languageName}. Using default voice.`);
        voice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
      }

      setSelectedVoice(voice);
      console.log("Selected voice:", voice ? voice.name : "None");
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
      } else {
        console.error("Speech synthesis not supported in this browser.");
      }
    }
  }, [isLoading, message.text, selectedVoice]);

  return (
    <div className="message-container">
      <div className="bot-message">{isLoading ? "..." : message.text}</div>
      <div className="language-info">Detected language: {message.language}</div>
      <div className="voice-info">Selected voice: {selectedVoice ? selectedVoice.name : "None"}</div>
      <div className="voice-count">Total voices: {availableVoices.length}</div>
    </div>
  );
}