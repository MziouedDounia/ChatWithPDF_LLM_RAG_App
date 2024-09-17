import { Environment, OrbitControls, useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Avatar } from "./Avatar";

export const Experience = ({ visemeData }) => {
  const texture = useTexture("textures/elbadi.jpg");
  const viewport = useThree((state) => state.viewport);

  return (
    <>
      
      <OrbitControls />
      <Avatar position={[0, -3, 5]} scale={2} visemeData={visemeData}/>
      <Environment preset="sunset" />
      <mesh>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </>
  );
};