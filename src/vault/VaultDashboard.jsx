// VaultDashboard.jsx — root: phases (boot → locked → unlocking → open → locking), auth panel,
// top bar, side panel (desktop) / bottom sheet (mobile), and the <Canvas>.

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { AnimatePresence, motion } from 'framer-motion';
import Scene from './Scene';
import Panel from './Panel';
import { CSS } from './styles';
import { T, playUnlock, playLock } from './sound';
import { useZakat, makeT, localeOf, authErrorKey } from './zakat';

function useWindowSize() {
  const get = () => ({ w: window.innerWidth, h: window.innerHeight });
  const [s, setS] = useState(get);
  useEffect(() => {
    const on = () => setS(get());
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => { window.removeEventListener('resize', on); window.removeEventListener('orientationchange', on); };
  }, []);
  return s;
}

function AuthPanel({ t, onSubmit, onGuest, busy, error }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  return (
    <motion.form
      className="vd-glass vd-auth"
      initial={{ opacity: 0, y: 30, scale: 0.96, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -24, scale: 1.06, filter: 'blur(12px)', transition: { duration: 0.6 } }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={(e) => { e.preventDefault(); onSubmit(mode, email.trim(), pass, pass2); }}
    >
      <div className="logo">⚜</div>
      <h1>{t('vault_title')}</h1>
      <p>{t('vault_sub')}</p>
      <div className="vd-atabs">
        <button type="button" className={`vd-atab ${mode === 'login' ? 'on' : ''}`} onClick={() => setMode('login')}>{t('tab_login')}</button>
        <button type="button" className={`vd-atab ${mode === 'reg' ? 'on' : ''}`} onClick={() => setMode('reg')}>{t('tab_register')}</button>
      </div>
      <input type="email" placeholder={t('ph_email')} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      <input type="password" placeholder={mode === 'login' ? t('ph_password') : t('ph_password_new')} value={pass}
        onChange={(e) => setPass(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
      {mode === 'reg' && (
        <input type="password" placeholder={t('ph_password_confirm')} value={pass2} onChange={(e) => setPass2(e.target.value)} autoComplete="new-password" />
      )}
      <button className="vd-btn" type="submit" disabled={busy}>{busy ? '...' : mode === 'login' ? t('btn_unlock') : t('btn_register')}</button>
      <div className="vd-err">{error}</div>
      <button type="button" className="vd-ghost" onClick={onGuest}>{t('btn_guest')}</button>
    </motion.form>
  );
}

export default function VaultDashboard() {
  const z = useZakat();
  const { lang } = z;
  const t = useMemo(() => makeT(lang), [lang]);
  const locale = localeOf(lang);

  const [phase, setPhase] = useState('boot');   // boot | locked | unlocking | open | locking
  const [focus, setFocus] = useState('overview');
  const [tab, setTab] = useState('assets');
  const [collapsed, setCollapsed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const tl = useRef({ t: 0, dir: 0, jump: false });
  const audio = useRef(null);
  const pendingLock = useRef(false);
  const { w, h } = useWindowSize();
  const isMobile = w < 900;

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = t('vault_title');
  }, [lang, t]);

  /* ---- audio: must be created inside the user's click ---- */
  const getAudio = () => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!audio.current && AC) audio.current = new AC();
    if (audio.current && audio.current.resume) audio.current.resume();
    return audio.current;
  };
  useEffect(() => () => { if (audio.current && audio.current.close) audio.current.close(); }, []);

  /* ---- boot: returning users (saved session / guest) see the open vault immediately ---- */
  useEffect(() => {
    if (phase !== 'boot' || !z.ready) return;
    if (z.user || z.guest) {
      tl.current.t = T.total; tl.current.jump = true;
      setPhase('open');
    } else {
      setPhase('locked');
    }
  }, [phase, z.ready, z.user, z.guest]);

  /* ---- sign out only after the door finished closing ---- */
  const { logout } = z;
  useEffect(() => {
    if (phase === 'locked' && pendingLock.current) { pendingLock.current = false; logout(); }
  }, [phase, logout]);

  const startUnlock = (ctx) => {
    playUnlock(ctx);
    tl.current.jump = false;
    tl.current.dir = 1;
    setPhase('unlocking');
  };

  const handleAuth = async (mode, email, pass, pass2) => {
    const ctx = getAudio();
    setError('');
    if (!email || !pass) { setError(t('err_enter_email_password')); return; }
    if (mode === 'reg') {
      if (pass !== pass2) { setError(t('err_password_mismatch')); return; }
      if (pass.length < 6) { setError(t('err_password_short')); return; }
    }
    setBusy(true);
    try {
      if (mode === 'login') await z.login(email, pass); else await z.register(email, pass);
    } catch (err) {
      setError(t(authErrorKey(err && err.code)));
      setBusy(false);
      return;
    }
    setBusy(false);
    startUnlock(ctx);
  };

  const handleGuest = () => { const ctx = getAudio(); z.enterGuest(); startUnlock(ctx); };

  const relock = () => {
    const ctx = getAudio();
    playLock(ctx);
    setFocus('overview');
    pendingLock.current = true;
    tl.current.dir = -1;
    setPhase('locking');
  };

  const onState = useCallback((s) => setPhase(s), []);

  /* ---- layout: where the 3D scene sits relative to the panel ---- */
  const sheetH = collapsed ? 108 : Math.min(h * 0.52, 460);
  const shift = useMemo(() => {
    if (phase !== 'open') return { x: 0, y: 0 };
    if (isMobile) return { x: 0, y: (sheetH - 100) / 2 };
    return { x: lang === 'ar' ? 208 : -208, y: 0 };
  }, [phase, isMobile, sheetH, lang]);

  const data = useMemo(() => ({ assets: z.assets, totals: z.totals, rates: z.rates, gold: z.gold }), [z.assets, z.totals, z.rates, z.gold]);
  const showUI = phase === 'open';
  const fmt1 = (n, d = 0) => (n ? n.toFixed(d) : '--');

  return (
    <div className="vd-root" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <style>{CSS}</style>

      <Canvas dir="ltr" style={{ direction: 'ltr' }} dpr={[1, isMobile ? 1.5 : 1.75]} camera={{ fov: 45, near: 0.1, far: 60, position: [0, 0, 8.5] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <Suspense fallback={null}>
          <Scene tl={tl} phase={phase} focus={focus} onState={onState} data={data} shift={shift}
            isMobile={isMobile} locale={locale} t={t} />
        </Suspense>
      </Canvas>

      <AnimatePresence>
        {phase === 'boot' && (
          <motion.div key="boot" className="vd-boot" initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.6 } }}>
            <div><div className="vd-wheel">⚜</div>{t('loading_vault')}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'locked' && (
        <button className="vd-mini vd-lang" onClick={() => z.setLang(lang === 'ar' ? 'en' : 'ar')}>{lang === 'ar' ? 'EN' : 'AR'}</button>
      )}

      <AnimatePresence>
        {phase === 'locked' && (
          <div className="vd-center" key="auth">
            <AuthPanel t={t} onSubmit={handleAuth} onGuest={handleGuest} busy={busy} error={error} />
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(phase === 'unlocking' || phase === 'locking') && (
          <motion.div key="status" className="vd-status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {phase === 'unlocking' ? t('status_unlocking') : t('status_locking')}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUI && (
          <motion.header key="top" className="vd-glass vd-top" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }} transition={{ delay: 0.2 }}>
            <div className="vd-brand">
              <b>⚜ {t('app_title')} <span className={`vd-sync ${z.syncing ? 'on' : ''}`} /></b>
              <small>{z.user ? z.user.email : t('badge_guest')}</small>
            </div>
            <div className="vd-actions">
              <button className="vd-mini" onClick={() => z.setLang(lang === 'ar' ? 'en' : 'ar')}>{lang === 'ar' ? 'EN' : 'AR'}</button>
              <button className="vd-mini" aria-label="refresh" onClick={() => z.refreshRates(true)}>↻</button>
              <button className="vd-btn" onClick={relock}>{t('btn_lock')}</button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUI && (
          <motion.div key="pills" className="vd-pills" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.4 }}>
            <span className="vd-pill">{t('pill_24k')} <b className="vd-num">{fmt1(z.gold.g24)}</b> {t('pill_unit_gram')}</span>
            <span className="vd-pill">{t('pill_21k')} <b className="vd-num">{fmt1(z.gold.g21)}</b> {t('pill_unit_gram')}</span>
            <span className="vd-pill">$ <b className="vd-num">{fmt1(z.rates.USD, 1)}</b> {t('pill_unit_egp')}</span>
            <span className="vd-pill">€ <b className="vd-num">{fmt1(z.rates.EUR, 1)}</b> {t('pill_unit_egp')}</span>
            <span className="vd-pill">﷼ <b className="vd-num">{fmt1(z.rates.SAR, 2)}</b> {t('pill_unit_egp')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUI && (
          <motion.aside
            key="panel"
            className={`vd-glass vd-panel ${collapsed ? 'collapsed' : ''}`}
            style={{ '--sheet-h': `${sheetH}px` }}
            initial={isMobile ? { opacity: 0, y: 80 } : { opacity: 0, x: lang === 'ar' ? 40 : -40 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={isMobile ? { opacity: 0, y: 80 } : { opacity: 0, x: lang === 'ar' ? 40 : -40 }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Panel z={z} t={t} lang={lang} locale={locale} focus={focus} setFocus={setFocus} tab={tab} setTab={setTab}
              collapsed={collapsed} setCollapsed={setCollapsed} />
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
