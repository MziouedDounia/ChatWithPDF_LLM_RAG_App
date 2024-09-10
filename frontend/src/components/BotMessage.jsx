import React, { useState, useEffect } from "react";

export default function BotMessage({ fetchMessage }) {
  const [isLoading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(null);

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
      console.log(voices,voices);
      const targetVoice = voices.find(voice => voice.name === 'Microsoft David - English (United States)');
      setSelectedVoice(targetVoice || null);
    }
    
    // Voices might not be available immediately, so listen for the event
    window.speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices();
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if (!isLoading && message && selectedVoice) {
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.voice = selectedVoice; // Set the selected voice
        window.speechSynthesis.speak(utterance);
      } else {
        console.error("Speech synthesis not supported in this browser.");
      }
    }
  }, [isLoading, message, selectedVoice]);

  return (
    <div className="message-container">
      <div className="bot-message">{isLoading ? "..." : message}</div>
    </div>
  );
}
