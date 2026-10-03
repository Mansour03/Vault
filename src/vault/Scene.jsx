// Scene.jsx — everything that lives inside the <Canvas>: the vault door, the treasury room,
// banknote stacks, gold bars, deposit boxes, lighting, camera moves and the unlock timeline.
// The whole animation is a pure function of timeline time `tl.current.t`, so running it
// backwards (dir = -1) re-locks the vault with no extra code.

import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControls, Environment, Html, Lightformer, Sparkles } from '@react-three/drei';
import { T } from './sound';
import {
  brushedTexture, floorTexture, dialTexture, screenTexture, stampTexture, plaqueTexture,
  edgeTexture, noteTexture, NOTE_STYLES,
} from './textures';

/* ───────────────────────── constants & helpers ───────────────────────── */

const DOOR_R = 2;
const BOLT_OUT = 2.0, BOLT_IN = 1.5;
const BOLT_ANGLES = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);
const SHELF_Y = { gold: 1.3, foreign: -0.2, local: -1.7 };   // board centre Y
const SHELF_Z = -8.9;
const UPPER = { gold: 2.35, foreign: 1.3, local: -0.2 };   // board above each shelf
const shelfTop = (k) => SHELF_Y[k] + 0.07;
const CYAN = new THREE.Color('#5fe9ff');
const GOLD_C = new THREE.Color('#ffcf66');

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// camera distance so the full shelf width (badges at x = ±1.6) fits on any aspect ratio
const camZ = (a = 1.78) => {
  const fov = a < 1 ? Math.min(75, 45 + (1 - a) * 45) : 45;
  const d = Math.min(7.5, Math.max(3.55, 2.2 / (Math.tan((fov * Math.PI) / 360) * a)));
  return -8.45 + d;
};

const POSES = {
  front: () => ({ pos: [0, 0, 8.5], target: [0, 0, 0] }),
  overview: (a) => ({ pos: [0, 0.1, a < 0.8 ? -1.0 : -1.3], target: [0, -0.1, -9] }),
  gold: (a) => ({ pos: [0, 1.4, camZ(a)], target: [0, 1.45, -9] }),
  foreign: (a) => ({ pos: [0, -0.1, camZ(a)], target: [0, 0.0, -9] }),
  local: (a) => ({ pos: [0, -1.5, camZ(a)], target: [0, -1.5, -9] }),
  boxes: () => ({ pos: [0.6, 0, -3.8], target: [3.5, 0, -6.5] }),
};
export const getPose = (focus, aspect) => (POSES[focus] || POSES.overview)(aspect);

/* ───────────────────────── materials ───────────────────────── */

const MatCtx = createContext(null);
const useM = () => useContext(MatCtx);

function MatsProvider({ children }) {
  const m = useMemo(() => {
    const brushed = brushedTexture();
    brushed.repeat.set(2, 2);
    const std = (o) => new THREE.MeshStandardMaterial(o);
    return {
      brushed,
      gold: std({ color: '#d4a63e', metalness: 1, roughness: 0.32, bumpMap: brushed, bumpScale: 0.25 }),
      goldBar: std({ color: '#e2b24a', metalness: 1, roughness: 0.26 }),
      steel: std({ color: '#4b515b', metalness: 1, roughness: 0.38, bumpMap: brushed, bumpScale: 0.6 }),
      dark: std({ color: '#16191e', metalness: 0.95, roughness: 0.32, bumpMap: brushed, bumpScale: 0.3 }),
      wall: std({ color: '#2a3038', metalness: 0.85, roughness: 0.48, bumpMap: brushed, bumpScale: 0.4 }),
      band: std({ color: '#d9cfae', roughness: 0.85 }),
    };
  }, []);
  useEffect(() => () => { Object.values(m).forEach((x) => x.dispose && x.dispose()); }, [m]);
  return <MatCtx.Provider value={m}>{children}</MatCtx.Provider>;
}

/* ───────────────────────── vault door ───────────────────────── */

const Gear = React.forwardRef(function Gear({ position, r = 0.3 }, ref) {
  const M = useM();
  return (
    <group ref={ref} position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={M.steel}><cylinderGeometry args={[r, r, 0.07, 28]} /></mesh>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI * 2) / 12;
        return (
          <mesh key={i} position={[Math.cos(a) * r, Math.sin(a) * r, 0]} rotation={[0, 0, a]} material={M.steel}>
            <boxGeometry args={[0.1, 0.07, 0.07]} />
          </mesh>
        );
      })}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={M.gold}><cylinderGeometry args={[r * 0.35, r * 0.35, 0.1, 24]} /></mesh>
    </group>
  );
});

function WallPlate() {
  const M = useM();
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-16, -11); s.lineTo(16, -11); s.lineTo(16, 11); s.lineTo(-16, 11); s.closePath();
    const hole = new THREE.Path(); hole.absarc(0, 0, 1.9, 0, Math.PI * 2, true); s.holes.push(hole);
    return new THREE.ExtrudeGeometry(s, { depth: 0.9, bevelEnabled: false, curveSegments: 96 });
  }, []);
  return (
    <>
      <mesh geometry={geo} material={M.wall} position={[0, 0, -0.9]} />
      {[-3.2, 3.2].map((y) => (
        <group key={y}>
          <mesh position={[0, y, 0.004]}><boxGeometry args={[32, 0.06, 0.02]} /><meshStandardMaterial color="#0b0d10" metalness={0.6} roughness={0.6} /></mesh>
          <mesh position={[0, y + (y > 0 ? 0.09 : -0.09), 0.006]} material={M.gold}><boxGeometry args={[32, 0.02, 0.02]} /></mesh>
        </group>
      ))}
      {[-5.4, 5.4].map((x) => (
        <mesh key={x} position={[x, 0, 0.004]}><boxGeometry args={[0.06, 22, 0.02]} /><meshStandardMaterial color="#0b0d10" metalness={0.6} roughness={0.6} /></mesh>
      ))}
      <mesh position={[0, 0, 0.012]} material={M.gold}><torusGeometry args={[1.95, 0.06, 16, 160]} /></mesh>
      {BOLT_ANGLES.map((a, i) => (
        <group key={i} rotation={[0, 0, a]}>
          <mesh position={[2.28, 0, 0.12]} material={M.dark}><boxGeometry args={[0.5, 0.3, 0.24]} /></mesh>
          <mesh position={[2.28, 0, 0.245]} material={M.gold}><boxGeometry args={[0.42, 0.04, 0.02]} /></mesh>
        </group>
      ))}
    </>
  );
}

function VaultDoor({ doorRef, wheelRef, boltRefs, gearRefs, screenMatRef, ringMatRef }) {
  const M = useM();
  const dial = useMemo(() => dialTexture(), []);
  const screen = useMemo(() => screenTexture(), []);
  return (
    <group ref={doorRef} position={[-DOOR_R, 0, 0.25]}>
      {[0.95, -0.95].map((y) => (
        <group key={y} position={[0, y, 0.02]}>
          <mesh material={M.gold}><cylinderGeometry args={[0.13, 0.13, 0.62, 28]} /></mesh>
          <mesh position={[0, 0.34, 0]} material={M.dark}><cylinderGeometry args={[0.07, 0.07, 0.1, 20]} /></mesh>
          <mesh position={[0, -0.34, 0]} material={M.dark}><cylinderGeometry args={[0.07, 0.07, 0.1, 20]} /></mesh>
        </group>
      ))}
      <group position={[DOOR_R, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={M.steel}><cylinderGeometry args={[DOOR_R, DOOR_R, 0.5, 128]} /></mesh>
        <mesh position={[0, 0, 0.255]} material={M.gold}><torusGeometry args={[1.93, 0.05, 20, 160]} /></mesh>
        <mesh position={[0, 0, 0.255]} material={M.dark}><torusGeometry args={[1.78, 0.04, 20, 160]} /></mesh>
        <mesh position={[0, 0, 0.255]} material={M.gold}><torusGeometry args={[1.42, 0.03, 20, 160]} /></mesh>
        <mesh position={[0, 0, 0.262]}>
          <torusGeometry args={[1.6, 0.014, 12, 160]} />
          <meshStandardMaterial ref={ringMatRef} color="#06232a" emissive="#5fe9ff" emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.252]}>
          <circleGeometry args={[1.36, 96]} />
          <meshStandardMaterial color="#3b414a" metalness={0.95} roughness={0.42} bumpMap={M.brushed} bumpScale={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.262]}>
          <circleGeometry args={[0.9, 64]} />
          <meshStandardMaterial map={dial} metalness={0.6} roughness={0.4} />
        </mesh>

        {Array.from({ length: 24 }, (_, i) => {
          const a = (i * Math.PI * 2) / 24;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.855, Math.sin(a) * 1.855, 0.272]}>
              <sphereGeometry args={[0.04, 16, 16]} /><meshStandardMaterial color="#b5893a" metalness={1} roughness={0.3} />
            </mesh>
          );
        })}

        {BOLT_ANGLES.map((a, i) => (
          <group key={i} rotation={[0, 0, a]}>
            <mesh ref={(el) => { boltRefs.current[i] = el; }} position={[BOLT_OUT, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.gold}>
              <cylinderGeometry args={[0.09, 0.09, 0.7, 20]} />
            </mesh>
          </group>
        ))}

        <Gear ref={(el) => { gearRefs.current[0] = el; }} position={[-1.05, 1.0, 0.28]} r={0.3} />
        <Gear ref={(el) => { gearRefs.current[1] = el; }} position={[-0.62, 1.24, 0.28]} r={0.2} />
        <Gear ref={(el) => { gearRefs.current[2] = el; }} position={[1.05, 1.0, 0.28]} r={0.26} />

        <group ref={wheelRef} position={[0, 0, 0.34]} scale={0.8}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={M.gold}><cylinderGeometry args={[0.28, 0.28, 0.24, 32]} /></mesh>
          <mesh material={M.gold}><torusGeometry args={[1.0, 0.06, 16, 96]} /></mesh>
          {Array.from({ length: 6 }, (_, i) => (
            <group key={i} rotation={[0, 0, (i * Math.PI) / 3]}>
              <mesh position={[0.55, 0, 0]} material={M.gold}><boxGeometry args={[1.0, 0.1, 0.1]} /></mesh>
              <mesh position={[1.12, 0, 0]} material={M.gold}><sphereGeometry args={[0.12, 20, 20]} /></mesh>
            </group>
          ))}
        </group>

        <group position={[0, -1.15, 0.27]}>
          <mesh material={M.dark}><boxGeometry args={[0.95, 0.34, 0.06]} /></mesh>
          <mesh position={[0, 0.05, 0.034]}>
            <planeGeometry args={[0.8, 0.15]} />
            <meshStandardMaterial ref={screenMatRef} color="#021014" emissive="#5fe9ff" emissiveMap={screen} emissiveIntensity={1.6} toneMapped={false} />
          </mesh>
          {Array.from({ length: 5 }, (_, i) => (
            <mesh key={i} position={[(i - 2) * 0.16, -0.08, 0.04]} material={M.gold}><boxGeometry args={[0.1, 0.06, 0.03]} /></mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

/* ───────────────────────── treasury ───────────────────────── */

function Room() {
  const floor = useMemo(() => floorTexture(), []);
  return (
    <group>
      <mesh position={[0, 0, -5.15]}>
        <boxGeometry args={[7, 5, 8.5]} />
        <meshStandardMaterial side={THREE.BackSide} color="#1a1d22" metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.49, -5.15]}>
        <planeGeometry args={[7, 8.5]} />
        <meshStandardMaterial map={floor} metalness={0.7} roughness={0.22} />
      </mesh>
      {[-2.2, 2.2].map((x) => (
        <mesh key={x} position={[x, 2.46, -5.15]}><boxGeometry args={[0.12, 0.03, 8]} /><meshBasicMaterial color="#fff0cc" toneMapped={false} /></mesh>
      ))}
      {[-3, -1.5, 0, 1.5, 3].map((x) => (
        <mesh key={x} position={[x, 0, -9.38]}>
          <boxGeometry args={[0.04, 4.9, 0.03]} />
          <meshStandardMaterial color="#8a6b2c" metalness={1} roughness={0.35} emissive="#8a6b2c" emissiveIntensity={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function ShelfUnit() {
  const M = useM();
  const plaques = useMemo(() => ({
    gold: plaqueTexture('GOLD'), foreign: plaqueTexture('USD · EUR'), local: plaqueTexture('SAR · EGP'),
  }), []);
  return (
    <group>
      {[-2.55, 2.55].map((x) => (
        <mesh key={x} position={[x, -0.075, SHELF_Z]} material={M.dark}><boxGeometry args={[0.12, 4.85, 0.55]} /></mesh>
      ))}
      <mesh position={[0, 2.35, SHELF_Z]} material={M.dark}><boxGeometry args={[5.4, 0.1, 0.8]} /></mesh>
      <mesh position={[0, 2.41, SHELF_Z]} material={M.gold}><boxGeometry args={[5.4, 0.02, 0.82]} /></mesh>
      {Object.entries(SHELF_Y).map(([k, y]) => (
        <group key={k} position={[0, y, SHELF_Z]}>
          <mesh material={M.dark}><boxGeometry args={[5.2, 0.1, 0.8]} /></mesh>
          <mesh position={[0, 0.056, 0]} material={M.gold}><boxGeometry args={[5.2, 0.022, 0.82]} /></mesh>
          <mesh position={[0, -0.07, 0.36]}><boxGeometry args={[5.0, 0.014, 0.03]} /><meshBasicMaterial color="#ffe3a8" toneMapped={false} /></mesh>
          {(() => {
            const ub = UPPER[k] - 0.05, cy = ub - 0.07 - 0.1125 - y;
            return (
              <>
                {[-0.5, 0.5].map((rx) => (
                  <mesh key={rx} position={[rx, ub - 0.035 - y, 0.415]} material={M.gold}><cylinderGeometry args={[0.008, 0.008, 0.07, 8]} /></mesh>
                ))}
                <mesh position={[0, cy, 0.415]}>
                  <planeGeometry args={[1.2, 0.225]} />
                  <meshStandardMaterial map={plaques[k]} emissive="#ffffff" emissiveMap={plaques[k]} emissiveIntensity={0.35} metalness={0.8} roughness={0.35} />
                </mesh>
              </>
            );
          })()}
        </group>
      ))}
    </group>
  );
}

function makeBarGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-0.12, 0); s.lineTo(0.12, 0); s.lineTo(0.088, 0.12); s.lineTo(-0.088, 0.12); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, steps: 1 });
  g.rotateY(Math.PI / 2);
  g.computeBoundingBox();
  const bb = g.boundingBox;
  g.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
  return { geo: g, height: bb.max.y - bb.min.y };
}

const barRows = (n) => { let r = 1; while ((r * (r + 1)) / 2 < n) r++; return r; };

function GoldBars({ count }) {
  const M = useM();
  const barRef = useRef();
  const stampRef = useRef();
  const { geo, height } = useMemo(() => makeBarGeometry(), []);
  const stamp = useMemo(() => stampTexture(), []);
  const STEP = 0.125;
  const spots = useMemo(() => {
    const rows = barRows(count), out = [];
    for (let r = 0; r < rows && out.length < count; r++) {
      const inRow = rows - r;
      for (let i = 0; i < inRow && out.length < count; i++) out.push([(i - (inRow - 1) / 2) * 0.58, r * STEP]);
    }
    return out;
  }, [count]);
  useLayoutEffect(() => {
    if (!barRef.current || !stampRef.current) return;
    const o = new THREE.Object3D();
    spots.forEach(([x, y], i) => {
      o.position.set(x, y, 0); o.rotation.set(0, 0, 0); o.updateMatrix(); barRef.current.setMatrixAt(i, o.matrix);
      o.position.set(x, y + height + 0.002, 0); o.rotation.set(-Math.PI / 2, 0, 0); o.updateMatrix(); stampRef.current.setMatrixAt(i, o.matrix);
    });
    barRef.current.instanceMatrix.needsUpdate = true;
    stampRef.current.instanceMatrix.needsUpdate = true;
  }, [spots, height]);
  if (!count) return null;
  return (
    <>
      <instancedMesh key={`bars-${count}`} ref={barRef} args={[geo, M.goldBar, spots.length]} frustumCulled={false} />
      <instancedMesh key={`stamp-${count}`} ref={stampRef} args={[undefined, undefined, spots.length]} frustumCulled={false}>
        <planeGeometry args={[0.36, 0.15]} />
        <meshStandardMaterial map={stamp} transparent metalness={0.9} roughness={0.45} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
      </instancedMesh>
    </>
  );
}

function CoinStack({ position, n = 7 }) {
  const M = useM();
  return (
    <group position={position}>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[(i % 2 ? 0.006 : -0.006), 0.011 + i * 0.024, 0]} material={M.gold}>
          <cylinderGeometry args={[0.15, 0.15, 0.022, 40]} />
        </mesh>
      ))}
    </group>
  );
}

const stackHeight = (amount) => (amount > 0 ? Math.min(0.62, 0.08 + Math.log10(amount + 1) * 0.09) : 0);

function CashStack({ position, rotY = 0, h, tex, tint }) {
  const M = useM();
  const W = 0.6, D = 0.3;
  const edge = useMemo(() => {
    const t = edgeTexture(tint);
    t.repeat.set(1, Math.max(1, h * 3));
    return t;
  }, [tint, h]);
  const side = useMemo(() => new THREE.MeshStandardMaterial({ map: edge, roughness: 0.9 }), [edge]);
  const top = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, metalness: 0.05 }), [tex]);
  useEffect(() => () => { edge.dispose(); side.dispose(); top.dispose(); }, [edge, side, top]);
  if (h <= 0) return null;
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, h / 2, 0]} material={[side, side, top, side, side, side]}>
        <boxGeometry args={[W, h, D]} />
      </mesh>
      <mesh position={[0, h / 2, 0]} material={M.band}>
        <boxGeometry args={[W * 0.16, h + 0.006, D + 0.006]} />
      </mesh>
    </group>
  );
}

function CurrencyGroup({ x, shelf, amount, code, tex }) {
  const M = useM();
  const style = NOTE_STYLES[code];
  const h = stackHeight(amount);
  return (
    <group position={[x, shelfTop(shelf), SHELF_Z]}>
      <group position={[0, 0.25, -0.18]} rotation={[-0.2, 0, 0]}>
        <mesh position={[0, 0, -0.004]} material={M.gold}><planeGeometry args={[1.06, 0.53]} /></mesh>
        <mesh>
          <planeGeometry args={[1.0, 0.47]} />
          <meshStandardMaterial map={tex} roughness={0.55} metalness={0.05} />
        </mesh>
      </group>
      <CashStack position={[-0.8, 0, 0.12]} rotY={0.05} h={h} tex={tex} tint={style.c2} />
      <CashStack position={[0.8, 0, 0.12]} rotY={-0.04} h={h * 0.78} tex={tex} tint={style.c2} />
    </group>
  );
}

function Badge({ position, title, value, sub, accent = '#d9b25a', open }) {
  return (
    <Html position={position} center distanceFactor={6} zIndexRange={[10, 0]}
      style={{ pointerEvents: 'none', opacity: open ? 1 : 0, transition: 'opacity .8s ease .5s' }}>
      <div className="vd-badge" style={{ '--accent': accent }}>
        <small>{title}</small>
        <strong>{value}</strong>
        {sub && <span>{sub}</span>}
      </div>
    </Html>
  );
}

function Treasury({ data, open, locale, t }) {
  const { assets, totals, rates } = data;
  const a = assets || { g24: 0, g21: 0, sar: 0, usd: 0, eur: 0, egp: 0 };
  const f = (n) => Math.round(n || 0).toLocaleString('en-US');
  const notes = useMemo(() => ({
    USD: noteTexture(NOTE_STYLES.USD), EUR: noteTexture(NOTE_STYLES.EUR),
    SAR: noteTexture(NOTE_STYLES.SAR), EGP: noteTexture(NOTE_STYLES.EGP),
  }), []);
  useEffect(() => () => Object.values(notes).forEach((x) => x.dispose()), [notes]);

  const eqGrams = (a.g24 || 0) + (a.g21 || 0) * 0.875;
  const goldCount = eqGrams > 0 ? Math.min(15, Math.max(3, Math.round(eqGrams / 10))) : 0;   // visual scale only
  const topG = shelfTop('gold');
  const gp = data.gold || {};
  const gv = (n) => (n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const bY = (k) => shelfTop(k) + 0.78;
  const BZ = SHELF_Z + 0.45;
  const eqEGP = (amt, r, fallback) => (amt || 0) * (r || fallback);

  return (
    <group>
      <Room />
      <ShelfUnit />
      {Object.keys(SHELF_Y).map((k) => (
        <pointLight key={k} position={[0, shelfTop(k) + 0.7, SHELF_Z + 0.9]} intensity={open ? 1.6 : 0} color="#ffd9a0" distance={4} decay={2} />
      ))}

      <group position={[0, topG, SHELF_Z]}><GoldBars count={goldCount} /></group>
      <CoinStack position={[-2.15, topG, SHELF_Z + 0.05]} n={8} />
      <CoinStack position={[-1.95, topG, SHELF_Z + 0.12]} n={4} />
      <CoinStack position={[2.15, topG, SHELF_Z + 0.05]} n={6} />

      <CurrencyGroup x={-1.3} shelf="foreign" amount={a.usd} code="USD" tex={notes.USD} />
      <CurrencyGroup x={1.3} shelf="foreign" amount={a.eur} code="EUR" tex={notes.EUR} />
      <CurrencyGroup x={-1.3} shelf="local" amount={a.sar} code="SAR" tex={notes.SAR} />
      <CurrencyGroup x={1.3} shelf="local" amount={a.egp} code="EGP" tex={notes.EGP} />

      <Badge open={open} position={[-1.6, topG + 0.45, BZ]} title="GOLD 24K" value={`${gv(a.g24)} g`} accent="#f3dc9c"
        sub={`≈ ${f((a.g24 || 0) * (gp.g24 || 0))} ${t('b_total')}`} />
      <Badge open={open} position={[1.6, topG + 0.45, BZ]} title="GOLD 21K" value={`${gv(a.g21)} g`} accent="#e8b860"
        sub={`≈ ${f((a.g21 || 0) * (gp.g21 || 0))} ${t('b_total')}`} />
      <Badge open={open} position={[-1.3, bY('foreign'), BZ]} title="USD" value={f(a.usd)} accent="#9bbd8a"
        sub={`≈ ${f(eqEGP(a.usd, rates.USD, 50.5))} ${t('b_total')}`} />
      <Badge open={open} position={[1.3, bY('foreign'), BZ]} title="EUR" value={f(a.eur)} accent="#e0a060"
        sub={`≈ ${f(eqEGP(a.eur, rates.EUR, 55.8))} ${t('b_total')}`} />
      <Badge open={open} position={[-1.3, bY('local'), BZ]} title="SAR" value={f(a.sar)} accent="#7fa6d2"
        sub={`≈ ${f(eqEGP(a.sar, rates.SAR, 13.5))} ${t('b_total')}`} />
      <Badge open={open} position={[1.3, bY('local'), BZ]} title="EGP" value={f(a.egp)} accent="#c0b777" />
    </group>
  );
}

/* ───────────────────────── view rig: FOV for portrait + shifting the scene away from the panel ───────────────────────── */

function ViewRig({ shift }) {
  const { camera, size } = useThree();
  const cur = useRef({ x: 0, y: 0 });
  const apply = useCallback((x, y) => {
    camera.setViewOffset(size.width, size.height, x, y, size.width, size.height);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  useLayoutEffect(() => {
    const aspect = size.width / size.height;
    camera.fov = aspect < 1 ? Math.min(75, 45 + (1 - aspect) * 45) : 45;
    apply(cur.current.x, cur.current.y);
  }, [camera, size.width, size.height, apply]);
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 6);
    const nx = cur.current.x + (shift.x - cur.current.x) * k;
    const ny = cur.current.y + (shift.y - cur.current.y) * k;
    if (Math.abs(nx - cur.current.x) > 0.05 || Math.abs(ny - cur.current.y) > 0.05) {
      cur.current.x = nx; cur.current.y = ny; apply(nx, ny);
    }
  });
  return null;
}

/* ───────────────────────── scene root ───────────────────────── */

export default function Scene({ tl, phase, focus, onState, data, shift, isMobile, locale, t }) {
  const controls = useRef();
  const size = useThree((s) => s.size);
  const aspect = size.width / size.height;

  const doorRef = useRef(), wheelRef = useRef(), screenMatRef = useRef(), ringMatRef = useRef();
  const boltRefs = useRef([]), gearRefs = useRef([]), roomLights = useRef([]);
  const camState = useRef('front');
  const ROOM_BASE = [9, 9, 3, 4];

  const goPose = useCallback((p, smooth = true) => {
    controls.current?.setLookAt(...p.pos, ...p.target, smooth);
  }, []);

  useEffect(() => { goPose(getPose('front'), false); }, [goPose]);

  useEffect(() => {
    if (phase === 'locking' || phase === 'locked' || phase === 'boot') {
      camState.current = 'front';
      goPose(getPose('front'), phase === 'locking');
    }
    if (phase === 'open') {
      const jump = tl.current.jump;
      tl.current.jump = false;
      camState.current = 'inside';
      goPose(getPose(focus, aspect), !jump);
    }
  }, [phase, focus, aspect, goPose, tl]);

  useFrame((_, dt) => {
    const s = tl.current;
    if (s.dir !== 0) {
      s.t = Math.min(T.total, Math.max(0, s.t + s.dir * Math.min(dt, 0.05)));
      if (s.dir > 0 && s.t >= T.camAt && camState.current !== 'inside') { camState.current = 'inside'; goPose(getPose('overview', aspect)); }
      if (s.dir > 0 && s.t >= T.total) { s.dir = 0; onState('open'); }
      if (s.dir < 0 && s.t <= 0) { s.dir = 0; onState('locked'); }
    }
    const w = easeIO(seg(s.t, T.wheelA, T.wheelB));
    const b = easeIO(seg(s.t, T.boltA, T.boltB));
    const d = easeIO(seg(s.t, T.doorA, T.doorB));

    if (wheelRef.current) wheelRef.current.rotation.z = -w * Math.PI * 4;
    gearRefs.current.forEach((g, i) => { if (g) g.rotation.z = w * Math.PI * 4 * (i % 2 ? 1.6 : -1.2); });
    boltRefs.current.forEach((m) => { if (m) m.position.x = THREE.MathUtils.lerp(BOLT_OUT, BOLT_IN, b); });
    if (doorRef.current) doorRef.current.rotation.y = -d * 1.95;
    if (ringMatRef.current) ringMatRef.current.emissive.lerpColors(CYAN, GOLD_C, w);
    if (screenMatRef.current) {
      screenMatRef.current.emissive.lerpColors(CYAN, GOLD_C, w);
      screenMatRef.current.emissiveIntensity = 1.4 + Math.sin(performance.now() / 300) * 0.25 * (1 - w);
    }
    roomLights.current.forEach((l, i) => { if (l) l.intensity = ROOM_BASE[i] * (0.06 + 0.94 * d); });
  });

  const showSparkles = phase === 'unlocking' || phase === 'open' || phase === 'locking';

  return (
    <MatsProvider>
      <color attach="background" args={['#07090c']} />
      <fog attach="fog" args={['#07090c', 14, 32]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 3, 6]} intensity={1.2} color="#ffe3b0" />
      <pointLight position={[-3, 1, 4]} intensity={2} color="#5fe9ff" />
      <pointLight ref={(el) => { roomLights.current[0] = el; }} position={[0, 2.1, -3.8]} intensity={0} color="#ffcf80" distance={12} />
      <pointLight ref={(el) => { roomLights.current[1] = el; }} position={[0, 2.1, -7.2]} intensity={0} color="#ffcf80" distance={12} />
      <pointLight ref={(el) => { roomLights.current[2] = el; }} position={[-2.8, 0.2, -6]} intensity={0} color="#a8e4ff" distance={9} />
      <pointLight ref={(el) => { roomLights.current[3] = el; }} position={[2.3, 0.4, -6.5]} intensity={0} color="#ffcf80" distance={7} />

      <Environment resolution={256} environmentIntensity={0.8}>
        <Lightformer form="rect" intensity={3.5} color="#ffd9a0" position={[0, 4, 2]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={0.7} color="#9fdcff" position={[-5, 1, 3]} rotation-y={Math.PI / 2} scale={[1, 5, 1]} />
        <Lightformer form="ring" intensity={1.6} color="#ffffff" position={[0, 0, -6]} scale={6} />
      </Environment>

      <WallPlate />
      <VaultDoor doorRef={doorRef} wheelRef={wheelRef} boltRefs={boltRefs} gearRefs={gearRefs} screenMatRef={screenMatRef} ringMatRef={ringMatRef} />
      <Treasury data={data} open={phase === 'open'} locale={locale} t={t} />
      {showSparkles && (
        <Sparkles count={isMobile ? 40 : 90} scale={[6, 4.5, 8]} position={[0, 0, -5.2]} size={2.2} speed={0.25} opacity={0.7} color="#ffd98a" />
      )}

      <ViewRig shift={shift} />
      <CameraControls ref={controls} makeDefault smoothTime={0.9}
        mouseButtons={{ left: 0, middle: 0, right: 0, wheel: 0 }} touches={{ one: 0, two: 0, three: 0 }} />
    </MatsProvider>
  );
}
