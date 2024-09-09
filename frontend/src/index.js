import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";

import BotMessage from "./components/BotMessage";
import UserMessage from "./components/UserMessage";
import Messages from "./components/Messages";
import Input from "./components/Input";

import { getChatbotResponse } from "./ChatbotAPI"; // Import the API function

import "./index.css";
import Header from "./components/Header";

function Chatbot() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    async function loadWelcomeMessage() {
      try {
        const welcomeMessage = "Hello, how can I assist you?";
        setMessages([
          <BotMessage
            key="0"
            fetchMessage={async () => welcomeMessage}
          />
        ]);
      } catch (error) {
        console.error("Error loading welcome message:", error);
      }
    }
    loadWelcomeMessage();
  }, []);

  const send = async (question) => {
    const userMessageKey = `user-${Date.now()}`;
    const botMessageKey = `bot-${Date.now()}`;

    // Display the UserMessage immediately
    setMessages(prevMessages => [
      ...prevMessages,
      <UserMessage key={userMessageKey} text={question} />,
      <BotMessage key={botMessageKey} fetchMessage={async () => "..."}/>
    ]);

    try {
      // Fetch bot's response from API
      const botResponse = await getChatbotResponse(question);
      
      // Update state to include the BotMessage once it’s ready
      setMessages(prevMessages => [
        ...prevMessages.slice(0, prevMessages.length - 1),
        <BotMessage key={botMessageKey} fetchMessage={async () => botResponse} />
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="chatbot">
      <Header />
      <Messages messages={messages} />
      <Input onSend={send} />
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<Chatbot />, rootElement);

// par chatgpt
// const rootElement = document.getElementById('root');
// if (rootElement) {
//   const root = ReactDOM.createRoot(rootElement);
//   root.render(<Chatbot />);
// }

