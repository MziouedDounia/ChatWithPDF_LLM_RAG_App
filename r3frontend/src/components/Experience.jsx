import { Environment, OrbitControls, useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Avatar } from "./Avatar";

export const Experience = ({ visemeData }) => {
  const texture = useTexture("textures/elbadi.jpg");
  const viewport = useThree((state) => state.viewport);

  const isMobile = window.innerWidth <= 768
  const avatarScale = isMobile ? 1.6 : 2; // Smaller scale for mobile
  const avatarPosition = isMobile ? [0, -2.4, 5] : [0, -3, 5]; // Adjust position for mobile
  // Adjust texture size for mobile
  const textureSize = isMobile ? [viewport.width * 2, viewport.height * 1.1] : [viewport.width, viewport.height];
  return (
    <>
      
      <OrbitControls />
      <Avatar position={avatarPosition} scale={avatarScale} visemeData={visemeData}/>
      <Environment preset="sunset" />
      <mesh>
        <planeGeometry args={textureSize} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </>
  );
};