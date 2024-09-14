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
      const targetVoice = voices.find(voice => voice.name === 'Microsoft David - English (United States)');
      setSelectedVoice(targetVoice || null);
    }
    
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
        utterance.voice = selectedVoice;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const destination = audioContext.createMediaStreamDestination();
        const mediaRecorder = new MediaRecorder(destination.stream);
        const audioChunks = [];

        mediaRecorder.ondataavailable = event => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const formData = new FormData();
          formData.append('file', audioBlob, 'response.wav');  // Ensure the key matches the server-side parameter

          await fetch('http://localhost:8000/save_audio', {  // Ensure the URL matches your server's address and port
            method: 'POST',
            body: formData
          });
        };

        const source = audioContext.createMediaStreamSource(destination.stream);
        source.connect(audioContext.destination);
        utterance.onstart = () => {
          mediaRecorder.start();
        };
        utterance.onend = () => {
          mediaRecorder.stop();
        };

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