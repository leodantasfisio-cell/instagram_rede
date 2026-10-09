import {ThreeCanvas} from '@remotion/three';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {cores} from './marca';

// Ilustração 3D de uma coluna com curva lateral em S, girando, com uma faixa
// de "escaneamento" subindo e descendo. Não representa nenhum paciente.
const VERTEBRAS = 17;

const Vertebra: React.FC<{i: number; brilho: number}> = ({i, brilho}) => {
  const t = i / (VERTEBRAS - 1);
  const y = interpolate(t, [0, 1], [2.2, -2.2]);
  const x = 0.32 * Math.sin(t * Math.PI * 2 - 0.4);
  const inclinacao = 0.32 * Math.cos(t * Math.PI * 2 - 0.4) * 0.6;
  const tamanho = interpolate(t, [0, 1], [0.78, 1.1]);
  return (
    <group position={[x, y, 0]} rotation={[0, 0, inclinacao]}>
      <mesh>
        <cylinderGeometry args={[0.2 * tamanho, 0.22 * tamanho, 0.17, 32]} />
        <meshStandardMaterial color="#F4F8FF" emissive={cores.azulClaro} emissiveIntensity={brilho} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0, -0.26 * tamanho]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[0.07, 0.09, 0.3 * tamanho]} />
        <meshStandardMaterial color="#E3ECFA" emissive={cores.azulClaro} emissiveIntensity={brilho} />
      </mesh>
      {[-1, 1].map((lado) => (
        <mesh key={lado} position={[lado * 0.24 * tamanho, 0, -0.1]} rotation={[0, 0, lado * 0.3]}>
          <boxGeometry args={[0.18 * tamanho, 0.06, 0.07]} />
          <meshStandardMaterial color="#E3ECFA" emissive={cores.azulClaro} emissiveIntensity={brilho} />
        </mesh>
      ))}
      {i < VERTEBRAS - 1 ? (
        <mesh position={[0, -0.13, 0]}>
          <cylinderGeometry args={[0.19 * tamanho, 0.19 * tamanho, 0.07, 32]} />
          <meshStandardMaterial color={cores.azul} roughness={0.3} />
        </mesh>
      ) : null}
    </group>
  );
};

export const Coluna3D: React.FC<{largura: number; altura: number}> = ({largura, altura}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const giro = t * 0.9;
  // Faixa de escaneamento vai e volta ao longo da coluna.
  const faixaY = 2.4 * Math.cos(t * 1.6);
  return (
    <ThreeCanvas width={largura} height={altura} camera={{fov: 30, position: [0, 0.7, 10.5]}}>
      <group rotation={[0.16, 0, 0]}>
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} />
      <directionalLight position={[-4, -2, -3]} intensity={0.6} color={cores.azulClaro} />
      <group rotation={[0.12, giro, 0]}>
        {Array.from({length: VERTEBRAS}, (_, i) => {
          const y = interpolate(i / (VERTEBRAS - 1), [0, 1], [2.2, -2.2]);
          const brilho = Math.max(0, 1 - Math.abs(y - faixaY) / 0.35) * 0.9;
          return <Vertebra key={i} i={i} brilho={brilho} />;
        })}
      </group>
      <mesh position={[0, faixaY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.0, 64]} />
        <meshBasicMaterial color={cores.azulClaro} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, faixaY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 64]} />
        <meshBasicMaterial color={cores.azulClaro} transparent opacity={0.12} />
      </mesh>
      </group>
    </ThreeCanvas>
  );
};
