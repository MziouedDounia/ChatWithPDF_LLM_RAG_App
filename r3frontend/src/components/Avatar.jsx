/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.5.0 public/models/66e0dd02d7709f89a67de4f8.glb 
*/
import { useFrame } from '@react-three/fiber'
import React from 'react'
import { useGraph } from '@react-three/fiber'
import { useGLTF,useFBX } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'

export function Avatar({ visemeData, ...props }) {
  const { scene } = useGLTF('models/66e0dd02d7709f89a67de4f8.glb');
  const { animations: GreetingAnimation } = useFBX("/animations/Standing Greeting.fbx");
  const { animations: WaitingAnimation } = useFBX("/animations/Dismissing Gesture.fbx");
  const { animations: IdleAnimation } = useFBX("/animations/Standard Idle.fbx");
  console.log(GreetingAnimation);

 
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes, materials } = useGraph(clone)

  // useEffect(() => {
  //   console.log(nodes.Wolf3D_Head.morphTargetDictionary);
  //   nodes.Wolf3D_Head.morphTargetInfluences[
  //     nodes.Wolf3D_Head.morphTargetDictionary["viseme_aa"]
  //   ] = 1;
  // }, []);
  useFrame(() => {
    if (visemeData && visemeData.viseme) {
      const visemeIndex = nodes.Wolf3D_Head.morphTargetDictionary[visemeData.viseme];
      const visemeTeethIndex = nodes.Wolf3D_Teeth.morphTargetDictionary[visemeData.viseme];
      const visemeBeardIndex = nodes.Wolf3D_Beard.morphTargetDictionary[visemeData.viseme];
      if (visemeIndex !== undefined) {
        nodes.Wolf3D_Head.morphTargetInfluences[visemeIndex] = 1;
        nodes.Wolf3D_Teeth.morphTargetInfluences[visemeTeethIndex] = 1;
        nodes.Wolf3D_Beard.morphTargetInfluences[visemeBeardIndex] = 1;

        // Reset the viseme after the timing interval (in milliseconds)
        setTimeout(() => {
          nodes.Wolf3D_Head.morphTargetInfluences[visemeIndex] = 0;
          nodes.Wolf3D_Teeth.morphTargetInfluences[visemeTeethIndex] = 0;
          nodes.Wolf3D_Beard.morphTargetInfluences[visemeBeardIndex] = 0;
        }, visemeData.time);
      }
    }
  });

  return (
    <group {...props} dispose={null}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        geometry={nodes.Wolf3D_Hair.geometry}
        material={materials.Wolf3D_Hair} 
        skeleton={nodes.Wolf3D_Hair.skeleton}
      />
      <skinnedMesh 
       geometry={nodes.Wolf3D_Body.geometry} 
       material={materials.Wolf3D_Body} 
       skeleton={nodes.Wolf3D_Body.skeleton} 
      />
      <skinnedMesh 
       geometry={nodes.Wolf3D_Outfit_Bottom.geometry} 
       material={materials.Wolf3D_Outfit_Bottom}
       skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
       />
      <skinnedMesh 
       geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
       material={materials.Wolf3D_Outfit_Footwear} 
       skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton} 
       />
      <skinnedMesh 
       geometry={nodes.Wolf3D_Outfit_Top.geometry}
       material={materials.Wolf3D_Outfit_Top}
       skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
       />
      <skinnedMesh
        name="EyeLeft" 
        geometry={nodes.EyeLeft.geometry} 
        material={materials.Wolf3D_Eye} 
        skeleton={nodes.EyeLeft.skeleton} 
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary} 
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences} 
      />
      <skinnedMesh 
        name="EyeRight" 
        geometry={nodes.EyeRight.geometry} 
        material={materials.Wolf3D_Eye} 
        skeleton={nodes.EyeRight.skeleton} 
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary} 
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences} 
      />
      <skinnedMesh 
        name="Wolf3D_Head" 
        geometry={nodes.Wolf3D_Head.geometry} 
        material={materials.Wolf3D_Skin} 
        skeleton={nodes.Wolf3D_Head.skeleton} 
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary} 
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences} 
      />
      <skinnedMesh 
        name="Wolf3D_Teeth" 
        geometry={nodes.Wolf3D_Teeth.geometry} 
        material={materials.Wolf3D_Teeth} 
        skeleton={nodes.Wolf3D_Teeth.skeleton} 
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary} 
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences} 
      />
      <skinnedMesh 
       name="Wolf3D_Beard" 
       geometry={nodes.Wolf3D_Beard.geometry} 
       material={materials.Wolf3D_Beard} 
       skeleton={nodes.Wolf3D_Beard.skeleton} 
       morphTargetDictionary={nodes.Wolf3D_Beard.morphTargetDictionary} 
       morphTargetInfluences={nodes.Wolf3D_Beard.morphTargetInfluences}
       />
    </group>
  )
}

useGLTF.preload('/66e0dd02d7709f89a67de4f8.glb')
