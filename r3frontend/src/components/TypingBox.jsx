import { getChatbotResponse } from "../hooks/ChatBotAPI";
import { useState } from "react";
import "../styles.css";
import BotMessage from "./BotMessage"; // Import BotMessage component
import SpeechToText from "./SpeechToText";

export const TypingBox = () => {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(""); // State to store chatbot response
  const [recording, setRecording] = useState(false);

  // Function to handle chatbot response fetching
  const ask = async () => {
    setLoading(true); // Set loading to true before fetching
    try {
      const answer = await getChatbotResponse(question); // Fetch response from API
      setResponse(answer); // Set the response to state
    } catch (error) {
      console.error("Error fetching chatbot response:", error);
      setResponse("I'm sorry, I couldn't understand that.");
    } finally {
      setLoading(false); // Set loading to false after fetching
      setQuestion(""); // Clear the input after fetching
    }
  };

  const startRecording = async () => {
    setRecording(true);
    const recorderElement = document.getElementById("recorder");
    const recording = await recordAudio();

    recorderElement.disabled = true;
    recording.start();

    // Wait for the user to stop recording
    while (recording) {
      await sleep(1);
    }

    const audio = await recording.stop();
    await sleep(2000);
    audio.play();
    recorderElement.disabled = false;
    setRecording(false);
  };

  return (
    <div className="z-10 max-w-[600px] flex flex-col space-y-6 bg-gradient-to-tr from-slate-300/30 via-gray-400/30 to-slate-600/30 p-4 backdrop-blur-md rounded-xl border border-slate-100/30">
      <div>
        <h2 className="text-white font-bold text-xl">
          Want to know the beautiful history of El Badi Palace?
        </h2>
        <p className="text-white/65">
          RedCityGuide chatbot is here to help you with any questions. Feel free to ask.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center">
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {/* Input Field */}
          <input
            className="flex-grow bg-slate-800/60 p-2 px-4 rounded-full text-white placeholder:text-white/50 shadow-inner shadow-slate-900/60 focus:outline focus:outline-white/80"
            placeholder="Type your questions here or use the audio button..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                ask();
              }
            }}
          />

          {/* Ask Button */}
          <button
            className="bg-slate-100/20 p-2 px-6 rounded-full text-white"
            onClick={ask}
          >
            Ask
          </button>

          
          <SpeechToText setQuestion={setQuestion} />
        </div>
      )}

      {/* Pass the response to BotMessage for audio playback */}
      {response && !loading && (
        <BotMessage fetchMessage={() => Promise.resolve(response)} />
      )}
    </div>
  );
};

// Helper Functions
const recordAudio = () =>
  new Promise(async (resolve) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks = [];
    mediaRecorder.addEventListener("dataavailable", (event) => {
      audioChunks.push(event.data);
    });

    const start = () => mediaRecorder.start();

    const stop = () =>
      new Promise((resolve) => {
        mediaRecorder.addEventListener("stop", () => {
          const audioBlob = new Blob(audioChunks);
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          const play = () => audio.play();
          resolve({ audioBlob, audioUrl, play });
        });
        mediaRecorder.stop();
      });
    resolve({ start, stop });
  });

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));
