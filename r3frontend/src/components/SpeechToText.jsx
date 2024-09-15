import React, { useState, useEffect } from 'react';
import Input from './Input'; // Import your Input component
import './speechToText.css'; 

const SpeechToText = ({ setTranscript }) => {
    const [isRecording, setIsRecording] = useState(false);
  
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US"; // Define language as French
  
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
  
        // Update the transcript in the parent component using setTranscript
        setTranscript((prevTranscript) => prevTranscript + finalTranscript);
      };
  
      recognition.onerror = (event) => {
        console.error("Erreur de reconnaissance vocale : ", event.error);
      };
    }, [recognition, setTranscript]); // Make sure setTranscript is in the dependency array
  
    const handleRecordingToggle = () => {
      if (isRecording) {
        recognition.stop();
        setIsRecording(false);
      } else {
        recognition.start();
        setIsRecording(true);
      }
    };
  
    return (
     
        <button
          id="recButton"
          className={isRecording ? "Rec" : "notRec"}
          onClick={handleRecordingToggle}
        >
          {isRecording ? "Recording" : "Not Recording"}
        </button>
        
 
    );
  };
  
  export default SpeechToText;