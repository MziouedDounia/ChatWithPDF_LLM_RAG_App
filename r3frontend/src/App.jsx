import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Formulaire from "./pages/Formulaire";
import LoadingSVG from "./components/LoadingSVG";
import { startSession } from "./hooks/ChatBotAPI";
import "./styles.css";

function Layout({ children, isLoading }) {
  if (isLoading) {
    return <LoadingSVG />;
  }

  return children;
}

function App() {
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
    
    const timer = setTimeout(() => setIsLoading(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleFormSubmit = async (formData) => {
    setIsLoading(true);
    try {
      const newSessionId = await startSession();
      localStorage.setItem('sessionId', newSessionId);
      localStorage.setItem('userData', JSON.stringify(formData));
      setIsFormSubmitted(true);
      setSessionId(newSessionId);
      setUserData(formData);
    } catch (error) {
      console.error("Error starting session:", error);
      // Assuming the form component handles displaying this error
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = async () => {
    setIsLoading(true);
    try {
      const newSessionId = await startSession();
      localStorage.setItem('sessionId', newSessionId);
      setIsFormSubmitted(true);
      setSessionId(newSessionId);
    } catch (error) {
      console.error("Error starting guest session:", error);
      // You might want to handle this error, perhaps by showing a message to the user
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Router>
      <Layout isLoading={isLoading}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route
            path="/home"
            element={
              isFormSubmitted ? (
                <Home sessionId={sessionId} userData={userData} />
              ) : (
                <Formulaire
                  onSubmit={handleFormSubmit}
                  onContinueAsGuest={handleContinueAsGuest}
                />
              )
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;