// styles.js — all UI CSS as one string (injected with a <style> tag by VaultDashboard).

export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&family=Cormorant+Garamond:wght@600;700&display=swap');

.vd-root{--gold:#d9b25a;--gold-hi:#f3dc9c;--gold-lo:#8a6b2c;--ink:#efe8d4;--muted:#a8a08a;--hint:#847d6a;--clay:#e0a090;
  --glass:rgba(16,20,26,.68);--line:rgba(217,178,90,.28);--field:rgba(0,0,0,.38);
  position:fixed;inset:0;background:#07090c;overflow:hidden;color:var(--ink);
  font-family:'Tajawal','Segoe UI',Tahoma,Arial,sans-serif;-webkit-tap-highlight-color:transparent}
.vd-root *{box-sizing:border-box}
.vd-root button,.vd-root input{font-family:inherit}
.vd-root canvas{touch-action:none}
.vd-num{font-family:Arial,Helvetica,sans-serif;font-weight:700;font-variant-numeric:tabular-nums;direction:ltr;unicode-bidi:plaintext}

.vd-glass{background:linear-gradient(160deg,rgba(255,255,255,.08),rgba(255,255,255,.015)),var(--glass);
  backdrop-filter:blur(22px) saturate(150%);-webkit-backdrop-filter:blur(22px) saturate(150%);
  border:1px solid var(--line);box-shadow:0 18px 50px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.1);border-radius:20px}

/* ---------- boot + status ---------- */
.vd-boot{position:absolute;inset:0;z-index:50;display:grid;place-items:center;background:radial-gradient(ellipse at top,#1a212b,#07090c 70%)}
.vd-boot div{text-align:center;color:var(--gold-hi);font-size:14px;letter-spacing:1px}
.vd-wheel{width:84px;height:84px;margin:0 auto 18px;border-radius:50%;display:grid;place-items:center;font-size:30px;color:var(--gold-hi);
  background:radial-gradient(circle,#1a222c 0 36%,transparent 37%),conic-gradient(#46535F,#2B3540,#46535F,#2B3540,#46535F,#2B3540,#46535F,#2B3540,#46535F);
  border:4px solid #8A7544;box-shadow:0 0 0 6px #161D25,0 0 0 8px #5D4F2D,0 14px 30px rgba(0,0,0,.55);animation:vdspin 2.4s linear infinite}
@keyframes vdspin{to{transform:rotate(360deg)}}
.vd-status{position:absolute;bottom:9%;inset-inline:0;text-align:center;font-size:15px;letter-spacing:1px;color:var(--gold-hi);pointer-events:none;text-shadow:0 2px 12px #000}

/* ---------- auth ---------- */
.vd-center{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;padding:16px;z-index:10}
.vd-auth{pointer-events:auto;width:min(370px,100%);padding:26px 24px 22px;display:flex;flex-direction:column;gap:11px;text-align:center}
.vd-auth .logo{font-size:30px;color:var(--gold-hi)}
.vd-auth h1{margin:0;font-size:28px;letter-spacing:2px;font-family:'Cormorant Garamond','Tajawal',serif;
  background:linear-gradient(90deg,#fff2b0,#d9b25a,#b8800f);-webkit-background-clip:text;background-clip:text;color:transparent}
.vd-auth p{margin:0 0 4px;font-size:13px;color:var(--muted)}
.vd-atabs{display:flex;border-bottom:1px solid var(--line);margin-bottom:4px}
.vd-atab{flex:1;padding:8px 0;font-size:13px;color:var(--muted);cursor:pointer;background:none;border:0;border-bottom:2px solid transparent}
.vd-atab.on{color:var(--gold-hi);border-bottom-color:var(--gold)}
.vd-auth input,.vd-in{width:100%;background:var(--field);border:1px solid rgba(255,255,255,.14);border-radius:11px;padding:11px 12px;font-size:14px;color:var(--ink);outline:none;
  box-shadow:inset 0 2px 5px rgba(0,0,0,.45)}
.vd-auth input:focus,.vd-in:focus{border-color:var(--gold);box-shadow:inset 0 2px 5px rgba(0,0,0,.45),0 0 0 2px rgba(217,178,90,.2)}
.vd-auth input::placeholder,.vd-in::placeholder{color:#5e6572}
.vd-btn{background:linear-gradient(180deg,#e9d298,#b8944c 55%,#8f6f33);color:#1c1507;border:1px solid #6b5528;border-radius:11px;padding:11px 14px;font-weight:700;font-size:14px;cursor:pointer;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 3px 10px rgba(0,0,0,.4)}
.vd-btn:active{transform:translateY(1px)}
.vd-btn:disabled{opacity:.55;cursor:wait}
.vd-ghost{background:transparent;border:1px dashed var(--line);border-radius:11px;padding:9px;font-size:13px;color:var(--muted);cursor:pointer}
.vd-err{min-height:18px;font-size:12px;color:var(--clay)}
.vd-lang{position:absolute;top:14px;inset-inline-end:14px;z-index:20}
.vd-mini{background:rgba(217,178,90,.12);border:1px solid var(--line);color:var(--gold-hi);padding:6px 12px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;letter-spacing:1px}

/* ---------- top bar ---------- */
.vd-top{position:absolute;top:10px;inset-inline:10px;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 14px}
.vd-brand{display:flex;flex-direction:column;min-width:0}
.vd-brand b{font-size:19px;color:var(--gold-hi);letter-spacing:2px;display:flex;align-items:center;gap:6px}
.vd-brand small{font-size:10px;color:var(--hint);max-width:46vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vd-sync{width:6px;height:6px;border-radius:50%;background:#7fa6c9;display:inline-block}
.vd-sync.on{background:var(--gold-hi);animation:vdp 1s infinite}
@keyframes vdp{0%,100%{opacity:1}50%{opacity:.3}}
.vd-actions{display:flex;gap:6px;align-items:center}
.vd-actions .vd-btn{padding:7px 12px;font-size:12px}
.vd-pills{position:absolute;top:70px;inset-inline:12px;z-index:19;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:2px}
.vd-pills::-webkit-scrollbar{display:none}
.vd-pill{background:rgba(10,12,16,.55);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--line);border-radius:20px;padding:4px 11px;white-space:nowrap;font-size:11.5px;color:var(--muted)}
.vd-pill b{color:var(--gold-hi);font-weight:700}

/* ---------- panel ---------- */
.vd-panel{position:absolute;z-index:15;display:flex;flex-direction:column;overflow:hidden}
.vd-handle{display:none;align-self:center;width:44px;height:5px;border-radius:5px;background:rgba(255,255,255,.28);border:0;margin:8px 0 2px;cursor:pointer;padding:0}
.vd-hero{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px 8px}
.vd-hero small{display:block;font-size:11px;color:var(--hint)}
.vd-hero strong{font-size:30px;line-height:1.05;color:var(--gold-hi)}
.vd-hero em{font-style:normal;font-size:12px;color:var(--muted);margin-inline-start:5px;font-family:'Tajawal',sans-serif}
.vd-chip{font-size:11px;font-weight:700;padding:5px 10px;border-radius:20px;white-space:nowrap}
.vd-chip.yes{background:rgba(243,220,156,.14);color:var(--gold-hi);border:1px solid rgba(243,220,156,.35)}
.vd-chip.no{background:rgba(224,160,144,.12);color:var(--clay);border:1px solid rgba(224,160,144,.35)}
.vd-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:2px 14px 8px}
.vd-chips::-webkit-scrollbar{display:none}
.vd-chips button{flex:0 0 auto;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:var(--muted);border-radius:16px;padding:6px 12px;font-size:12px;cursor:pointer}
.vd-chips button.on{background:rgba(217,178,90,.2);border-color:var(--line);color:var(--gold-hi)}
.vd-tabs{display:flex;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:rgba(0,0,0,.18)}
.vd-tab{flex:1;padding:10px 0;font-size:13px;font-weight:500;color:var(--muted);cursor:pointer;background:none;border:0;border-bottom:2px solid transparent}
.vd-tab.on{color:var(--gold-hi);border-bottom-color:var(--gold);background:rgba(217,178,90,.06)}
.vd-body{flex:1;overflow-y:auto;padding:12px 14px 20px;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:#5d4f2d transparent}
.vd-panel.collapsed .vd-chips,.vd-panel.collapsed .vd-tabs,.vd-panel.collapsed .vd-body{display:none}

.vd-card{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:13px 14px;margin-bottom:12px}
.vd-ct{font-size:13px;font-weight:700;color:var(--gold-hi);margin-bottom:10px;display:flex;align-items:center;gap:7px}
.vd-ct i{width:6px;height:6px;border-radius:50%;background:var(--gold);display:inline-block}
.vd-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.vd-field label{display:block;font-size:11px;color:var(--hint);margin-bottom:4px}
.vd-in{padding:9px 10px}
.vd-hint{font-size:11px;color:var(--hint);line-height:1.6;margin-top:6px}
.vd-link{background:none;border:0;color:var(--gold);text-decoration:underline;cursor:pointer;font-size:11px;padding:0}
.vd-st{font-size:11.5px;color:var(--muted);text-align:center;margin-top:8px;min-height:16px}
.vd-btn.wide{width:100%;margin-top:6px}

.vd-stat{background:linear-gradient(160deg,#1f2933,#141b23);border:1px solid rgba(255,255,255,.08);border-radius:11px;padding:10px;text-align:center}
.vd-stat small{display:block;font-size:10px;color:var(--hint);margin-bottom:3px}
.vd-stat b{font-size:20px;color:var(--gold-hi);display:block}
.vd-stat span{font-size:10px;color:var(--muted)}
.vd-stat.hl{grid-column:1/-1;background:linear-gradient(180deg,#e0c887,#b08f48 60%,#8a6c30);border-color:#6b5528}
.vd-stat.hl small,.vd-stat.hl span{color:#3a2c0e}
.vd-stat.hl b{color:#1c1507;font-size:28px}

.vd-gold{background:linear-gradient(160deg,#2c2a1e,#1b1a12);border:1px solid var(--line);border-radius:11px;padding:11px;text-align:center}
.vd-gold small{display:block;font-size:11px;color:var(--gold);font-weight:700}
.vd-gold b{font-size:24px;color:var(--gold-hi);display:block}
.vd-gold span{font-size:10px;color:var(--hint)}
.vd-rate{background:linear-gradient(160deg,#1f2933,#141b23);border:1px solid rgba(255,255,255,.08);border-radius:11px;padding:10px 12px}
.vd-rate .f{font-size:20px}
.vd-rate small{display:block;font-size:11px;color:var(--muted)}
.vd-rate b{font-size:19px;color:var(--ink)}
.vd-warn{font-size:12px;font-weight:600;color:var(--clay);text-align:center;margin-top:8px;padding:8px 10px;background:rgba(224,160,144,.09);border:1px solid rgba(224,160,144,.35);border-radius:10px}

.vd-zk{border-radius:14px;padding:14px;margin-bottom:12px}
.vd-zk.yes{background:rgba(243,220,156,.07);border:1px solid rgba(243,220,156,.32)}
.vd-zk.no{background:rgba(224,160,144,.07);border:1px solid rgba(224,160,144,.32)}
.vd-zk h4{margin:8px 0 4px;font-size:16px}
.vd-zk.yes h4{color:var(--gold-hi)}.vd-zk.no h4{color:var(--clay)}
.vd-zk p{margin:3px 0;font-size:12px;color:var(--muted);line-height:1.6}
.vd-zk p b{color:var(--ink)}
.vd-due{margin-top:10px;padding:8px 10px;background:rgba(243,220,156,.12);border-radius:9px;font-size:12px;color:var(--gold-hi);text-align:center;font-weight:700}
.vd-amt{display:flex;align-items:baseline;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(243,220,156,.22);flex-wrap:wrap}
.vd-amt span{font-size:12px;color:var(--muted)}
.vd-amt b{font-size:30px;color:var(--gold-hi)}
.vd-bar{margin-top:6px}
.vd-bar .l{display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:5px}
.vd-track{height:8px;border-radius:8px;background:#10161d;border:1px solid rgba(255,255,255,.1);overflow:hidden;box-shadow:inset 0 1px 3px rgba(0,0,0,.6)}
.vd-fill{height:100%;border-radius:8px;transition:width .6s ease}
.vd-fill.yes{background:linear-gradient(90deg,#b89b5e,#f3dc9c)}
.vd-fill.no{background:linear-gradient(90deg,#b77562,#e0a090)}
.vd-note{font-size:11px;color:var(--muted);text-align:center;margin-top:10px;padding:6px;background:rgba(0,0,0,.25);border-radius:9px;border:1px solid rgba(255,255,255,.07)}
.vd-info p{margin:4px 0;font-size:12px;color:var(--muted);line-height:1.8}
.vd-info b{color:var(--gold-hi)}
.vd-muted{color:var(--hint);font-size:12px}
.center{text-align:center;padding:10px 0}

/* ---------- 3D badges ---------- */
.vd-badge{--accent:#d9b25a;min-width:116px;padding:7px 12px;text-align:center;border-radius:12px;background:rgba(10,12,16,.6);backdrop-filter:blur(8px);
  border:1px solid var(--accent);box-shadow:0 0 18px color-mix(in srgb,var(--accent) 35%,transparent);color:#efe8d4;white-space:nowrap;font-family:'Tajawal','Segoe UI',sans-serif}
.vd-badge small{display:block;font-size:11px;letter-spacing:1.5px;color:var(--accent);font-weight:700}
.vd-badge strong{display:block;font-size:18px;font-family:Arial,Helvetica,sans-serif;direction:ltr;font-variant-numeric:tabular-nums}
.vd-badge span{display:block;font-size:10.5px;color:#a8a08a;direction:ltr}

/* ---------- polish ---------- */
.vd-root::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:5;background:radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.55) 100%)}
.vd-badge{background:linear-gradient(160deg,rgba(255,255,255,.12),rgba(10,12,16,.7));box-shadow:0 0 22px color-mix(in srgb,var(--accent) 40%,transparent),inset 0 1px 0 rgba(255,255,255,.18)}
.vd-badge strong{color:#fff4cf;text-shadow:0 0 12px color-mix(in srgb,var(--accent) 60%,transparent)}
.vd-hero strong{background:linear-gradient(180deg,#fff2b0,#d9b25a);-webkit-background-clip:text;background-clip:text;color:transparent}
.vd-panel{border-top:1px solid rgba(243,220,156,.55)}
.vd-brk{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 2px;border-bottom:1px solid rgba(255,255,255,.07)}
.vd-brk span{display:block;font-size:12.5px;color:var(--ink)}
.vd-brk small{display:block;font-size:11px;color:var(--hint);margin-top:2px}
.vd-brk b{font-size:17px;color:var(--gold-hi);white-space:nowrap}
.vd-brk b em{font-style:normal;font-size:11px;color:#3a2c0e;font-family:'Tajawal',sans-serif}
.vd-brk.tot{border:0;margin-top:6px;padding:10px 12px;border-radius:11px;background:linear-gradient(180deg,#e0c887,#b08f48 60%,#8a6c30)}
.vd-brk.tot span,.vd-brk.tot b{color:#1c1507}
@media (max-width:899px){.vd-badge{min-width:100px;padding:6px 9px}.vd-badge strong{font-size:16px}.vd-brk b{font-size:15px}}

/* ---------- desktop ---------- */
@media (min-width:900px){
  .vd-panel{top:118px;bottom:14px;inset-inline-start:14px;width:400px}
  .vd-pills{top:72px}
}
/* ---------- mobile bottom sheet ---------- */
@media (max-width:899px){
  .vd-panel{inset-inline:0;bottom:0;height:var(--sheet-h);border-radius:22px 22px 0 0;transition:height .45s cubic-bezier(.22,1,.36,1);padding-bottom:env(safe-area-inset-bottom)}
  .vd-handle{display:block}
  .vd-hero strong{font-size:26px}
  .vd-top{padding:7px 12px}
  .vd-pills{top:64px}
}
`;
