import React, { useState, useEffect, useCallback } from "react";

const NLLB_TO_VOICE_NAME = {
  'eng_Latn': 'Microsoft David - English (United States)',
  'fra_Latn': 'Microsoft Julie - French (France)',
  'spa_Latn': 'Microsoft Pablo - Spanish (Spain)',
  'deu_Latn': 'Microsoft Katja - German (Germany)',
  'ita_Latn': 'Microsoft Elsa - Italian (Italy)',
  'swh_Latn': 'Microsoft Zuri - Swahili (Kenya)',
  'arb_Arab': 'Microsoft Hamed - Arabic (Saudi Arabia)',
  'rus_Cyrl': 'Microsoft Dmitry - Russian (Russia)',
  'zho_Hans': 'Microsoft Xiaoxiao - Chinese (Mainland)',
  'zho_Hant': 'Microsoft HiuGaai - Chinese (Hong Kong)',
  'jpn_Jpan': 'Microsoft Nanami - Japanese (Japan)',
  'kor_Hang': 'Microsoft SunHi - Korean (Korea)',
  'por_Latn': 'Microsoft Antonio - Portuguese (Brazil)',
  'hin_Deva': 'Microsoft Swara - Hindi (India)',
  'ben_Beng': 'Microsoft Bashkar - Bangla (India)',
  'urd_Arab': 'Microsoft Uzma - Urdu (Pakistan)',
  'vie_Latn': 'Microsoft HoaiMy - Vietnamese (Vietnam)',
  'ind_Latn': 'Microsoft Andika - Indonesian (Indonesia)',
  'tha_Thai': 'Microsoft Niwat - Thai (Thailand)',
  'pol_Latn': 'Microsoft Paulina - Polish (Poland)',
  'ukr_Cyrl': 'Microsoft Ostap - Ukrainian (Ukraine)',
  'nld_Latn': 'Microsoft Colette - Dutch (Netherlands)',
  'tur_Latn': 'Microsoft Emel - Turkish (Turkey)',
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
        language: msg.language || ""
      });
    } catch (error) {
      console.error("Error fetching message:", error);
      setLoading(false);
      setMessage({ text: "Error fetching message. Please try again.", language: "eng_Latn" });
    }
  }, [fetchMessage]);

  useEffect(() => {
    loadMessage();
  }, [loadMessage]);

  useEffect(() => {
    function updateVoices() {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      console.log("Available voices:", voices.map(v => `${v.name} (${v.lang})`));
    }
    
    window.speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices();
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    function selectVoice(language) {
      const targetVoiceName = NLLB_TO_VOICE_NAME[language] || NLLB_TO_VOICE_NAME['eng_Latn'];
      let voice = availableVoices.find(v => v.name === targetVoiceName);
      
      if (!voice) {
        console.warn(`Voice ${targetVoiceName} not found. Trying to find a voice for the language.`);
        const languageCode = language.split('_')[0];
        voice = availableVoices.find(v => v.lang.startsWith(languageCode));
      }
      
      if (!voice && availableVoices.length > 0) {
        console.warn("No matching voice found. Using default voice.");
        voice = availableVoices[0];
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
        window.speechSynthesis.cancel(); // Cancel any ongoing speech
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
    </div>
  );
}