// App.jsx
import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Formulaire from "./pages/Formulaire";
import LoadingSVG from "./components/LoadingSVG";
import "./styles.css";

function App() {
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  const handleFormSubmit = (formData) => {
    console.log("Form submitted:", formData);
    setIsFormSubmitted(true); // Update state to show the new view after form submission
  };

  const handleContinueAsGuest = () => {
    setIsFormSubmitted(true); // Redirect to new view without form submission
  };

  return (
    <Router>
      <Routes>
      <Route path="/" element={<LoadingSVG />} />
        <Route
          path="/home"
          element={
            isFormSubmitted ? (
              <Home />
            ) : (
              <Formulaire
                onSubmit={handleFormSubmit}
                onContinueAsGuest={handleContinueAsGuest}
              />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;