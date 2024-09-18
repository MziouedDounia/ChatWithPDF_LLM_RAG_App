import React, { useState, useEffect } from 'react';

const SpeechToText = ({ setQuestion }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState("en-US"); // Default language is English
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = language; // Set language dynamically

  useEffect(() => {
    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece;
        } else {
          interimTranscript += transcriptPiece;
        }
      }

      // Update the question in TypingBox component using setQuestion
      setQuestion((prevQuestion) => prevQuestion + finalTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error: ", event.error);
    };
  }, [recognition, setQuestion]);

  const handleRecordingToggle = () => {
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  return (
    <div>
      {/* Dropdown to select language */}
      <select value={language} onChange={handleLanguageChange} className="mb-4 p-2 border border-gray-300" style={{
          backgroundColor: 'transparent',
          border: 'none',
          padding:'0px',
          position:'absolute',
          right:'432px',
          top:'65px',// Light border
          padding: '8px',
        }}>
        <option value="en-US">English</option>
        <option value="es-ES">Spanish</option>
        <option value="fr-FR">French</option>
        <option value="ar-SA">Arabic</option>
      </select>
      
      <button
        id="recButton"
        className={`relative w-12 h-12 rounded-full flex items-center justify-center cursor-pointer bg-[#38383d] border border-[#f9f9fa33] shadow-md transition-all ${
          isRecording ? "recording" : ""
        } ${isRecording ? "Rec" : "notRec"}`}
        onClick={handleRecordingToggle}
      >
        <img
          id="record"
          src="https://assets.codepen.io/3537853/record.svg"
          draggable="false"
          className={`w-3/5 h-3/5 absolute ${isRecording ? "animate-recording" : ""}`}
          alt="Record"
        />
        <img
          id="arrow"
          src="https://assets.codepen.io/3537853/arrow.svg"
          draggable="false"
          className="w-1/2 h-1/2 absolute opacity-0"
          alt="Arrow"
        />
      </button>
    </div>
  );
};

export default SpeechToText;
