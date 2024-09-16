import React from "react";
import { Canvas } from "@react-three/fiber";
import { Experience } from "../components/Experience";
import { TypingBox } from "../components/TypingBox";
import "../../src/styles.css";

const Home = ({ sessionId, userData }) => {
  return (
    <>
      <div className="typing-box-container">
        <TypingBox sessionId={sessionId} userData={userData} />
      </div>
      <Canvas shadows camera={{ position: [0, 0, 8], fov: 42 }}>
        <color attach="background" args={["#ececec"]} />
        <Experience />
      </Canvas>
    </>
  );
};

export default Home;
