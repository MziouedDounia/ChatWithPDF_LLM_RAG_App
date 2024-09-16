// App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Formulaire from "./pages/Formulaire";
import LoadingSVG from "./components/LoadingSVG";
import { startSession } from "./hooks/ChatBotAPI";
import "./styles.css";

function Layout({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const storedSessionId = localStorage.getItem('sessionId');
    const storedUserData = localStorage.getItem('userData');

    if (storedSessionId) {
      setSessionId(storedSessionId);
      setIsFormSubmitted(true);
      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      }
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <LoadingSVG />;
  }

  return children({ isFormSubmitted, sessionId, userData, setIsFormSubmitted, setSessionId, setUserData });
}

function App() {
  const handleFormSubmit = async (formData) => {
    console.log("Form submitted:", formData);
    try {
      const newSessionId = await startSession();
      localStorage.setItem('sessionId', newSessionId);
      localStorage.setItem('userData', JSON.stringify(formData));
      return { sessionId: newSessionId, userData: formData };
    } catch (error) {
      console.error("Error starting session:", error);
      throw error;
    }
  };

  const handleContinueAsGuest = async () => {
    try {
      const newSessionId = await startSession();
      localStorage.setItem('sessionId', newSessionId);
      return { sessionId: newSessionId };
    } catch (error) {
      console.error("Error starting session:", error);
      throw error;
    }
  };

  return (
    <Router>
      <Layout>
        {({ isFormSubmitted, sessionId, userData, setIsFormSubmitted, setSessionId, setUserData }) => (
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route
              path="/home"
              element={
                isFormSubmitted ? (
                  <Home sessionId={sessionId} userData={userData} />
                ) : (
                  <Formulaire
                    onSubmit={async (formData) => {
                      const result = await handleFormSubmit(formData);
                      setIsFormSubmitted(true);
                      setSessionId(result.sessionId);
                      setUserData(result.userData);
                    }}
                    onContinueAsGuest={async () => {
                      const result = await handleContinueAsGuest();
                      setIsFormSubmitted(true);
                      setSessionId(result.sessionId);
                    }}
                  />
                )
              }
            />
          </Routes>
        )}
      </Layout>
    </Router>
  );
}

export default App;