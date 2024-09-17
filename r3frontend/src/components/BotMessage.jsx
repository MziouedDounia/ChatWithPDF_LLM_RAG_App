import React, { useState, useEffect, useRef } from "react";

// Phoneme to Oculus Viseme mapping
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

// Simple function to convert text to approximate phonemes
function textToPhonemes(text) {
  return text.toUpperCase().split('').map(char => {
    if ('AEIOU'.includes(char)) return char;
    if ('BCDFGHJKLMNPQRSTVWXYZ'.includes(char)) return char;
    return '_'; // for any other character
  });
}

// Function to convert phonemes to visemes
function phonemesToVisemes(phonemes) {
  return phonemes.map(phoneme => phonemeToVisemeMap[phoneme] || 'viseme_sil');
}

export default function BotMessage({ fetchMessage, onVisemeData  }) {
  const [isLoading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(null);
  const utteranceRef = useRef(null);
  const hasSpokenRef = useRef(false);

  useEffect(() => {
    async function loadMessage() {
      const msg = await fetchMessage();
      setLoading(false);
      setMessage(msg);
    }
    loadMessage();
  }, [fetchMessage]);

  useEffect(() => {
    function updateVoices() {
      const voices = window.speechSynthesis.getVoices();
      console.log(voices);
      const targetVoice = voices.find(voice => voice.name === 'Microsoft David - English (United States)');
      setSelectedVoice(targetVoice || null);
    }

    window.speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices();

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Function to map text to visemes and estimate timings
  const estimateVisemesAndTimings = (text, duration) => {
    const phonemes = textToPhonemes(text);
    const visemes = phonemesToVisemes(phonemes);
    const timings = phonemes.map((_, index) => (index * duration) / phonemes.length);
    return { visemes, timings };
  };

  useEffect(() => {
    if (!isLoading && message && selectedVoice && !hasSpokenRef.current) {
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.voice = selectedVoice;
        utteranceRef.current = utterance;

        const wordsPerMinute = 150;
        const wordCount = message.split(' ').length;
        const estimatedDuration = (wordCount / wordsPerMinute) * 60 * 1000; // Convert to milliseconds

        const { visemes, timings } = estimateVisemesAndTimings(message, estimatedDuration);

        console.log('Visemes and Timings: ', visemes, timings);

        utterance.onstart = () => {
          console.log("Speech started");
          // Start logging visemes and timings as the speech begins
          timings.forEach((timing, index) => {
            setTimeout(() => {
              console.log(`Current Viseme: ${visemes[index]}, Timing: ${timing}ms`);
              onVisemeData(visemes[index], timings[index]); // Pass viseme and timing data
            }, timing);
          });
        };

        window.speechSynthesis.speak(utterance);
        hasSpokenRef.current = true; // Mark as spoken
      } else {
        console.error("Speech synthesis not supported in this browser.");
      }
    }
  }, [isLoading, message, selectedVoice, onVisemeData]);

  return (
    <div className="message-container">
      <div className="bot-message">{isLoading ? "..." : message}</div>
    </div>
  );
}