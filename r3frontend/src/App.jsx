import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { TypingBox } from "./components/TypingBox";
import "./styles.css";
import { Form } from "./components/Form";

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
    <>
      {isFormSubmitted ? (
        <>
          <div className="typing-box-container">
            <TypingBox />
          </div>
          <Canvas shadows camera={{ position: [0, 0, 8], fov: 42 }}>
            <color attach="background" args={["#ececec"]} />
            <Experience />
          </Canvas>
        </>
      ) : (
        <Form onSubmit={handleFormSubmit} onContinueAsGuest={handleContinueAsGuest} />
      )}
    </>
  );
}

export default App;
