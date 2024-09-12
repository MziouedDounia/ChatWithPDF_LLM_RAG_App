import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { TypingBox } from "./components/TypingBox";
import "./styles.css";

function App() {
  return (
    <>
      <div className="typing-box-container">
        <TypingBox/>
        </div>
      <Canvas shadows camera={{ position: [0, 0, 8], fov: 42 }}>
        <color attach="background" args={["#ececec"]} />
        <Experience />
      </Canvas>
      
    </>
  );
}

export default App;