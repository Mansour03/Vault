// Panel.jsx — the dashboard panel: hero total, camera chips and the three tabs
// (My Assets / Prices / Zakat) ported from the original Zakat app.

import React, { useEffect, useState } from 'react';
import { formatDateDual, NISAB } from './zakat';

const CAMS = [['overview', 'cam_overview'], ['gold', 'cam_gold'], ['foreign', 'cam_foreign'], ['local', 'cam_local']];
const FIELDS = [['g24', 'label_g24'], ['g21', 'label_g21'], ['usd', 'label_usd'], ['eur', 'label_eur'], ['sar', 'label_sar'], ['egp', 'label_egp']];

const toDateInput = (d) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/* ───────── tab: assets ───────── */
function AssetsTab({ z, t, locale }) {
  const empty = { g24: '', g21: '', sar: '', usd: '', eur: '', egp: '' };
  const [form, setForm] = useState(empty);
  const [manual, setManual] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const a = z.assets;
    setForm(a ? { g24: a.g24 || '', g21: a.g21 || '', sar: a.sar || '', usd: a.usd || '', eur: a.eur || '', egp: a.egp || '' } : empty);
    setManual(z.nisabDate ? toDateInput(new Date(z.nisabDate)) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [z.assets, z.nisabDate]);

  const save = async () => { setSaving(true); await z.saveAssets(form, manual); setSaving(false); };
  const fmt = (n) => Math.round(n || 0).toLocaleString('en-US');
  const st = z.status ? t(z.status.key) + (z.status.extra || '') : '';
  const a = z.assets, tot = z.totals;

  return (
    <>
      <div className="vd-card">
        <div className="vd-ct"><i /> {t('card_enter_assets')}</div>
        <div className="vd-grid2">
          {FIELDS.map(([k, lbl]) => (
            <div className="vd-field" key={k}>
              <label>{t(lbl)}</label>
              <input className="vd-in" type="number" inputMode="decimal" min="0" step="any" placeholder="0"
                value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
        </div>
        <div className="vd-field" style={{ marginTop: 10 }}>
          <label>{t('label_nisab_date')}</label>
          <input className="vd-in" type="date" value={manual} onChange={(e) => setManual(e.target.value)} />
          <div className="vd-hint">{t('hint_nisab_date')} <button type="button" className="vd-link" onClick={z.resetNisabStart}>{t('link_reset_nisab')}</button></div>
        </div>
        <button className="vd-btn wide" disabled={saving} onClick={save}>{saving ? t('btn_saving') : t('btn_save')}</button>
        <div className="vd-st">{st}</div>
      </div>

      {a && tot && (
        <div className="vd-card">
          <div className="vd-stat hl"><small>{t('stat_total')}</small><b className="vd-num">{fmt(tot.total)}</b><span>{t('unit_egp_full')}</span></div>
        </div>
      )}
    </>
  );
}

/* ───────── tab: prices ───────── */
function PricesTab({ z, t, locale }) {
  const { gold, rates, priceInfo: p } = z;
  const a = z.assets || {}, tot = z.totals;
  const n2 = (n) => (n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const rows = [['label_g24', a.g24, gold.g24], ['label_g21', a.g21, gold.g21], ['label_usd', a.usd, rates.USD || 50.5],
    ['label_eur', a.eur, rates.EUR || 55.8], ['label_sar', a.sar, rates.SAR || 13.5], ['label_egp', a.egp, 1]];
  const warn = p.stale ? (p.lastGoodTs ? `${t('price_warning_stale')} ${new Date(p.lastGoodTs).toLocaleString('en-US')}` : t('price_warning_never')) : '';
  return (
    <>
      <div className="vd-card">
        <div className="vd-ct"><i /> {t('card_gold_prices')}</div>
        <div className="vd-grid2">
          <div className="vd-gold"><small>{t('stat_24')}</small><b className="vd-num">{gold.g24 ? gold.g24.toFixed(0) : '--'}</b><span>{t('unit_egp_gram')}</span></div>
          <div className="vd-gold"><small>{t('stat_21')}</small><b className="vd-num">{gold.g21 ? gold.g21.toFixed(0) : '--'}</b><span>{t('unit_egp_gram')}</span></div>
        </div>
        <div className="vd-st">{p.loading ? t('updating') : ''}</div>
        {warn && <div className="vd-warn">{warn}</div>}
      </div>
      <div className="vd-card">
        <div className="vd-ct"><i /> {t('card_currency_rates')}</div>
        <div className="vd-grid2">
          {[['🇺🇸', 'cur_usd', rates.USD], ['🇪🇺', 'cur_eur', rates.EUR], ['🇸🇦', 'cur_sar', rates.SAR], ['🇪🇬', 'cur_egp', 1]].map(([flag, k, v]) => (
            <div className="vd-rate" key={k}>
              <div className="f">{flag}</div><small>{t(k)}</small>
              <b className="vd-num">{v ? v.toFixed(2) : '--'}</b>
            </div>
          ))}
        </div>
        <div className="vd-st">{p.updated ? `${t('last_update')} ${new Date(p.updated).toLocaleTimeString(locale)}` : ''}</div>
      </div>
      <div className="vd-card">
        <div className="vd-ct"><i /> {t('card_breakdown')}</div>
        {rows.map(([k, amt, rate]) => (
          <div className="vd-brk" key={k}>
            <div><span>{t(k)}</span><small className="vd-num">{n2(amt)} × {n2(rate)}</small></div>
            <b className="vd-num">{Math.round((amt || 0) * (rate || 0)).toLocaleString('en-US')}</b>
          </div>
        ))}
        <div className="vd-brk tot"><div><span>{t('stat_total')}</span></div><b className="vd-num">{Math.round(tot ? tot.total : 0).toLocaleString('en-US')} <em>{t('currency_egp')}</em></b></div>
      </div>
    </>
  );
}

/* ───────── tab: zakat ───────── */
function ZakatTab({ z, t, lang, locale }) {
  const zk = z.zakat, tot = z.totals;
  const fmt = (n) => Math.round(n || 0).toLocaleString('en-US');
  return (
    <>
      <div className="vd-card">
        <div className="vd-ct"><i /> {t('card_calc_zakat')}</div>
        {!zk ? (
          <div className="vd-muted center">{t('save_first')}</div>
        ) : (
          <>
            {zk.elig ? (
              <div className="vd-zk yes">
                <span className="vd-chip yes">{t('badge_reached_nisab')}</span>
                <h4>{t('title_eligible')}</h4>
                <p>{t('reached_since')} {formatDateDual(zk.startDate, lang, t)} {t('hawl_start_suffix')}</p>
                <p>{t('wealth_now')} <b>{fmt(tot.total)} {t('currency_egp')}</b> {t('nisab_label')} {fmt(zk.nEGP)} {t('currency_egp')}</p>
                {zk.hawlDone ? (
                  <div className="vd-due">{t('hawl_complete_msg')}</div>
                ) : (
                  <>
                    <p>{t('due_date_label')} <b>{formatDateDual(zk.dueDate, lang, t)}</b></p>
                    <p>{t('remaining_label')} <b>{zk.daysLeft} {t('days_unit')}</b></p>
                  </>
                )}
                <div className="vd-amt">
                  <span>{zk.hawlDone ? t('amount_due_now') : t('amount_expected')}</span>
                  <b className="vd-num">{fmt(zk.zamt)}</b><span>{t('currency_egp')}</span>
                </div>
                <div className="vd-st">{t('auto_update_note')}</div>
              </div>
            ) : (
              <div className="vd-zk no">
                <span className="vd-chip no">{t('badge_not_reached')}</span>
                <h4>{t('title_not_eligible')}</h4>
                <p>{t('gold24_equiv')} {zk.t24.toFixed(2)} {t('grams_unit')}</p>
                <p>{t('remaining_to_nisab')} {(NISAB - zk.t24).toFixed(2)} {t('grams_unit')}</p>
              </div>
            )}
            <div className="vd-bar">
              <div className="l"><span>{t('progress_label')}</span><span>{zk.pct.toFixed(1)}%</span></div>
              <div className="vd-track"><div className={`vd-fill ${zk.elig ? 'yes' : 'no'}`} style={{ width: `${zk.pct}%` }} /></div>
            </div>
            {zk.nEGP > 0 && <div className="vd-note">{t('current_nisab_value')} {fmt(zk.nEGP)} {t('currency_egp')}</div>}
          </>
        )}
      </div>
      <div className="vd-card vd-info">
        <div className="vd-ct"><i /> {t('card_info')}</div>
        {['info_1', 'info_2', 'info_3', 'info_5', 'info_6', 'info_7'].map((k) => (
          <p key={k} dangerouslySetInnerHTML={{ __html: t(k) }} />
        ))}
      </div>
    </>
  );
}

/* ───────── panel shell ───────── */
export default function Panel({ z, t, lang, locale, focus, setFocus, tab, setTab, collapsed, setCollapsed }) {
  const fmt = (n) => Math.round(n || 0).toLocaleString('en-US');
  const zk = z.zakat;
  return (
    <>
      <button className="vd-handle" aria-label="toggle" onClick={() => setCollapsed(!collapsed)} />
      <div className="vd-hero" onClick={() => collapsed && setCollapsed(false)}>
        <div>
          <small>{t('hero_total')}</small>
          <strong className="vd-num">{fmt(z.totals ? z.totals.total : 0)}<em>{t('currency_egp')}</em></strong>
        </div>
        {zk && <span className={`vd-chip ${zk.elig ? 'yes' : 'no'}`}>{zk.elig ? t('badge_reached_nisab') : t('badge_not_reached')}</span>}
      </div>
      <div className="vd-chips">
        {CAMS.map(([k, lbl]) => (
          <button key={k} className={focus === k ? 'on' : ''} onClick={() => setFocus(k)}>{t(lbl)}</button>
        ))}
      </div>
      <div className="vd-tabs">
        {[['assets', 'tab_assets'], ['prices', 'tab_prices'], ['zakat', 'tab_zakat']].map(([k, lbl]) => (
          <button key={k} className={`vd-tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{t(lbl)}</button>
        ))}
      </div>
      <div className="vd-body">
        {tab === 'assets' && <AssetsTab z={z} t={t} locale={locale} />}
        {tab === 'prices' && <PricesTab z={z} t={t} locale={locale} />}
        {tab === 'zakat' && <ZakatTab z={z} t={t} lang={lang} locale={locale} />}
      </div>
    </>
  );
}
