import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Experience } from "../components/Experience";
import { TypingBox } from "../components/TypingBox";
import "../../src/styles.css";
import {Leva} from Leva;
const Home = () => {
  const [visemeData, setVisemeData] = useState({ viseme: '', time: 0 });

  const handleVisemeData = (viseme, time) => {
    setVisemeData({ viseme, time });
  };

  return (
    <>
    
      <div className="typing-box-container">
        <TypingBox onVisemeData={handleVisemeData} />
      </div>
      <Canvas shadows camera={{ position: [0, 0, 8], fov: 42 }}>
        <color attach="background" args={["#ececec"]} />
        <Experience visemeData={visemeData} />
      </Canvas>
    </>
  );
};

export default Home;
