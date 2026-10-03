// VaultDashboard.jsx
import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './Scene';
import Panel from './Panel';
import { CSS } from './styles';

export default function VaultDashboard() {
  const [phase, setPhase] = useState('open');
  const [focus, setFocus] = useState('overview');
  const [tab, setTab] = useState('assets');
  const [collapsed, setCollapsed] = useState(false);

  const tl = useRef({ t: 1, dir: 0, jump: false });

  const mockZakat = {
    assets: { g24: 0, g21: 0, sar: 0, usd: 0, eur: 0, egp: 0 },
    totals: { total: 0, gEGP: 0, cEGP: 0 },
    gold: { g24: 3100, g21: 2712 },
    rates: { USD: 50.5, EUR: 55.8, SAR: 13.5 },
    priceInfo: { loading: false, stale: false },
    zakat: null,
    saveAssets: async () => {},
  };

  return (
    <div className="vd-root" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <style>{CSS}</style>

      {/* Canvas للرسم ثلاثي الأبعاد فقط */}
      <Canvas
        style={{ position: 'absolute', inset: 0 }}
        camera={{ position: [0, 0, 8.5], fov: 50 }}
      >
        <Scene
          tl={tl}
          phase={phase}
          focus={focus}
          onState={setPhase}
          data={mockZakat}
          shift={{ x: 0, y: 0 }}
          isMobile={false}
          locale="ar-EG"
          t={(k) => k}
        />
      </Canvas>

      {/* الواجهة العادية 2D Panel خارج الـ Canvas */}
      <Panel
        z={mockZakat}
        t={(k) => k}
        lang="ar"
        locale="ar-EG"
        focus={focus}
        setFocus={setFocus}
        tab={tab}
        setTab={setTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
    </div>
  );
}