// zakat.js — data layer: Firebase (auth + Firestore), live prices, Nisab/Hawl logic, i18n.
// Same Firestore document shape as the original app: users/{uid} → g24,g21,sar,usd,eur,egp,nisabDate,savedAt
// so existing accounts and saved data keep working.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence,
} from 'firebase/auth';
import {
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, getDoc, setDoc,
} from 'firebase/firestore';

/* ───────────────────────── firebase ───────────────────────── */

const firebaseConfig = {
  apiKey: 'AIzaSyAP6cb9HerGIdvaKqJtEZF4a4HVS4PpVqc',
  authDomain: 'zakah-89cd7.firebaseapp.com',
  projectId: 'zakah-89cd7',
  storageBucket: 'zakah-89cd7.firebasestorage.app',
  messagingSenderId: '764011796925',
  appId: '1:764011796925:web:2a61add92f1d79ddb29ad4',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

let _db;
try {
  _db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch (e) {
  _db = getFirestore(app); // already initialised (hot reload) or persistence unsupported
}
const db = _db;

const authReady = setPersistence(auth, browserLocalPersistence).catch(() => {});

/* ───────────────────────── constants ───────────────────────── */

export const NISAB = 85;          // grams of 24K gold
export const HAWL_DAYS = 354;     // one lunar year, approximated
const RATES_CACHE_KEY = 'zakat_rates_cache';
const RATES_CACHE_TTL = 5 * 60 * 1000;

const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } };
const lsDel = (k) => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } };

/* ───────────────────────── i18n ───────────────────────── */

const I18N = {
  // auth
  vault_title:      { ar: 'الخزنة', en: 'The Vault' },
  vault_sub:        { ar: 'سجّل دخولك لفتح خزنتك', en: 'Sign in to open your vault' },
  tab_login:        { ar: 'دخول', en: 'Login' },
  tab_register:     { ar: 'حساب جديد', en: 'New account' },
  ph_email:         { ar: 'البريد الإلكتروني', en: 'Email' },
  ph_password:      { ar: 'كلمة المرور', en: 'Password' },
  ph_password_new:  { ar: 'كلمة المرور (6 أحرف+)', en: 'Password (6+ characters)' },
  ph_password_confirm: { ar: 'تأكيد كلمة المرور', en: 'Confirm password' },
  btn_unlock:       { ar: '🔓 فتح الخزنة', en: '🔓 Open the vault' },
  btn_register:     { ar: 'إنشاء حساب وفتح الخزنة', en: 'Create account & open' },
  btn_guest:        { ar: 'متابعة بدون حساب', en: 'Continue without an account' },
  btn_lock:         { ar: '🔒 قفل الخزنة', en: '🔒 Lock vault' },
  status_unlocking: { ar: '🔓 جاري فك الأقفال…', en: '🔓 Releasing the locks…' },
  status_locking:   { ar: '🔒 جاري إغلاق الخزنة…', en: '🔒 Closing the vault…' },
  loading_vault:    { ar: 'جاري تجهيز الخزنة…', en: 'Preparing the vault…' },
  // header
  app_title:        { ar: 'زكاة', en: 'Zakat' },
  badge_guest:      { ar: 'زائر', en: 'Guest' },
  pill_24k:         { ar: '24ك', en: '24K' },
  pill_21k:         { ar: '21ك', en: '21K' },
  pill_unit_gram:   { ar: 'ج/غ', en: 'EGP/g' },
  pill_unit_egp:    { ar: 'ج', en: 'EGP' },
  // camera chips
  cam_overview:     { ar: 'نظرة عامة', en: 'Overview' },
  cam_gold:         { ar: 'الذهب', en: 'Gold' },
  cam_foreign:      { ar: 'عملات أجنبية', en: 'Foreign' },
  cam_local:        { ar: 'عملات محلية', en: 'Local' },
  cam_boxes:        { ar: 'الصناديق', en: 'Boxes' },
  // tabs
  tab_assets:       { ar: 'أصولي', en: 'My Assets' },
  tab_prices:       { ar: 'الأسعار', en: 'Prices' },
  tab_zakat:        { ar: 'الزكاة', en: 'Zakat' },
  // hero
  hero_total:       { ar: 'إجمالي ثروتك', en: 'Your total wealth' },
  // assets tab
  card_enter_assets:{ ar: 'أودِع ممتلكاتك', en: 'Deposit your holdings' },
  label_g24:        { ar: 'ذهب عيار 24 (جرام)', en: 'Gold 24K (grams)' },
  label_g21:        { ar: 'ذهب عيار 21 (جرام)', en: 'Gold 21K (grams)' },
  label_sar:        { ar: 'ريال سعودي', en: 'Saudi Riyal' },
  label_usd:        { ar: 'دولار أمريكي', en: 'US Dollar' },
  label_eur:        { ar: 'يورو', en: 'Euro' },
  label_egp:        { ar: 'جنيه مصري', en: 'Egyptian Pound' },
  label_nisab_date: { ar: 'تاريخ دخولك النصاب (اختياري)', en: 'Date you reached Nisab (optional)' },
  hint_nisab_date:  {
    ar: 'لو النصاب معاك من زمان، حدد التاريخ هنا وهيحسب الحول منه. سيبها فاضية عشان يحسبها تلقائياً من أول يوم تدخل بياناتك وتبلغ النصاب.',
    en: 'If you have had the Nisab for a while, set the date here and the hawl will be calculated from it. Leave it empty to calculate it automatically from the first day you enter data and reach Nisab.',
  },
  link_reset_nisab: { ar: 'إعادة الحساب من النهاردة', en: 'Recalculate from today' },
  btn_save:         { ar: '🔒 احفظ في الخزنة', en: '🔒 Lock in the vault' },
  btn_saving:       { ar: 'جاري الحفظ...', en: 'Saving...' },
  card_breakdown:   { ar: 'قيمة ممتلكاتك بالجنيه', en: 'Your holdings in EGP' },
  card_total_assets:{ ar: 'محتويات الخزنة', en: 'Vault contents' },
  stat_24:          { ar: 'عيار 24', en: '24K' },
  stat_21:          { ar: 'عيار 21', en: '21K' },
  stat_gold_value:  { ar: 'قيمة الذهب', en: 'Gold value' },
  stat_cash:        { ar: 'النقود', en: 'Cash' },
  unit_gram:        { ar: 'جرام', en: 'grams' },
  unit_egp:         { ar: 'جنيه', en: 'EGP' },
  stat_total:       { ar: 'إجمالي ثروتك', en: 'Your total wealth' },
  unit_egp_full:    { ar: 'جنيه مصري', en: 'Egyptian Pounds' },
  last_edited:      { ar: 'آخر تعديل:', en: 'Last edited:' },
  // prices tab
  card_gold_prices: { ar: 'أسعار الذهب (جنيه/جرام)', en: 'Gold Prices (EGP/gram)' },
  unit_egp_gram:    { ar: 'جنيه/جرام', en: 'EGP/gram' },
  card_currency_rates: { ar: 'أسعار العملات (مقابل الجنيه)', en: 'Currency Rates (vs EGP)' },
  cur_usd:          { ar: 'دولار', en: 'US Dollar' },
  cur_eur:          { ar: 'يورو', en: 'Euro' },
  cur_sar:          { ar: 'ريال', en: 'Riyal' },
  cur_egp:          { ar: 'جنيه', en: 'Pound' },
  updating:         { ar: 'جاري التحديث...', en: 'Updating...' },
  last_update:      { ar: 'آخر تحديث:', en: 'Last update:' },
  price_warning_stale: { ar: 'تعذر تحديث الأسعار الآن — المعروض من آخر تحديث ناجح بتاريخ:', en: 'Could not refresh live prices — showing the last successful update from:' },
  price_warning_never: { ar: '⚠️ تعذر الوصول لأي مصدر أسعار حالياً، والرقم المعروض تقديري فقط وقد يختلف كثيراً عن السعر الفعلي', en: '⚠️ Could not reach any price source right now — the number shown is a rough estimate and may differ a lot from the real price' },
  // zakat tab
  card_calc_zakat:  { ar: 'حساب الزكاة', en: 'Zakat Calculation' },
  save_first:       { ar: 'احفظ بياناتك أولاً', en: 'Save your data first' },
  card_info:        { ar: 'معلومات', en: 'Information' },
  info_1: { ar: '• <b>النصاب:</b> 85 جرام ذهب عيار 24', en: '• <b>Nisab:</b> 85 grams of 24K gold' },
  info_2: { ar: '• <b>عيار 21:</b> يتحول تلقائياً (×21/24)', en: '• <b>21K gold:</b> converted automatically (×21/24)' },
  info_3: { ar: '• <b>مقدار الزكاة:</b> 2.5% من إجمالي الثروة', en: '• <b>Zakat rate:</b> 2.5% of total wealth' },
  info_5: { ar: '• <b>الحول:</b> لازم يفضل معاك النصاب سنة هجرية كاملة (~354 يوم) من أول يوم بلغت فيه النصاب', en: '• <b>Hawl:</b> you must keep the Nisab for one full lunar year (~354 days) from the first day you reached it' },
  info_6: { ar: '• <b>لو نزلت تحت النصاب</b> في أي وقت خلال السنة، الحول بيتصفر ولازم يبدأ من جديد لما تبلغ النصاب تاني', en: '• <b>If you drop below Nisab</b> at any point during the year, the hawl resets and must start over once you reach Nisab again' },
  info_7: { ar: '• <b>عند تمام الحول</b> بتدفع 2.5% من إجمالي ثروتك وقتها (مش وقت ما بلغت النصاب)', en: '• <b>Once the hawl completes</b> you pay 2.5% of your total wealth at that point (not when you first reached Nisab)' },
  badge_reached_nisab: { ar: '✓ بلغت النصاب', en: '✓ Nisab reached' },
  title_eligible:   { ar: 'أنت مستحق للزكاة', en: 'You owe Zakat' },
  reached_since:    { ar: 'بلغت النصاب منذ:', en: 'Reached Nisab since:' },
  hawl_start_suffix:{ ar: '(بداية الحول)', en: '(hawl start)' },
  wealth_now:       { ar: 'ثروتك الآن:', en: 'Your wealth now:' },
  nisab_label:      { ar: '— النصاب:', en: '— Nisab:' },
  currency_egp:     { ar: 'جنيه', en: 'EGP' },
  hawl_complete_msg:{ ar: '🔔 تم الحول الكامل (سنة هجرية) — زكاتك مستحقة الدفع الآن', en: '🔔 Full hawl complete (lunar year) — your Zakat is due now' },
  due_date_label:   { ar: 'تاريخ استحقاق الزكاة (تمام الحول):', en: 'Zakat due date (hawl complete):' },
  remaining_label:  { ar: 'متبقٍ على الاستحقاق:', en: 'Remaining until due:' },
  days_unit:        { ar: 'يوم', en: 'days' },
  amount_due_now:   { ar: 'مقدار الزكاة المستحقة الآن (2.5%)', en: 'Zakat amount due now (2.5%)' },
  amount_expected:  { ar: 'المقدار المتوقع حالياً لو استمر الحول (2.5%)', en: 'Expected amount if the hawl continues (2.5%)' },
  auto_update_note: { ar: 'هذا المبلغ بيتحدث تلقائياً كل ما تعدّل بياناتك أو تتغير الأسعار، وهيبقى نهائي في تاريخ الاستحقاق', en: 'This amount updates automatically whenever you edit your data or prices change, and becomes final on the due date' },
  badge_not_reached:{ ar: '✗ لم تبلغ النصاب', en: '✗ Nisab not reached' },
  title_not_eligible:{ ar: 'لست مستحقاً للزكاة حالياً', en: 'You do not owe Zakat currently' },
  gold24_equiv:     { ar: 'معادل ذهبك عيار 24:', en: 'Your 24K gold equivalent:' },
  remaining_to_nisab:{ ar: 'متبقي للنصاب:', en: 'Remaining to reach Nisab:' },
  grams_unit:       { ar: 'جرام', en: 'grams' },
  progress_label:   { ar: 'تقدمك نحو النصاب', en: 'Your progress toward Nisab' },
  current_nisab_value:{ ar: 'قيمة النصاب الحالية:', en: 'Current Nisab value:' },
  ce_suffix:        { ar: ' م', en: ' CE' },
  ah_suffix:        { ar: ' هـ', en: ' AH' },
  // 3D badges
  b_gold:           { ar: 'الذهب', en: 'GOLD' },
  b_total:          { ar: 'ج.م', en: 'EGP' },
  // status / errors
  saved_cloud:      { ar: '✓ تم الحفظ في حسابك ☁', en: '✓ Saved to your account ☁' },
  saved_local:      { ar: '✓ تم الحفظ محلياً', en: '✓ Saved locally' },
  loaded_cloud:     { ar: '✓ تم تحميل بياناتك', en: '✓ Your data was loaded' },
  no_saved_data:    { ar: 'لا توجد بيانات محفوظة بعد', en: 'No saved data yet' },
  load_error:       { ar: 'خطأ في التحميل: ', en: 'Load error: ' },
  save_error:       { ar: 'فشل الحفظ: ', en: 'Save failed: ' },
  err_enter_email_password: { ar: 'أدخل البريد وكلمة المرور', en: 'Enter your email and password' },
  err_password_mismatch:    { ar: 'كلمتا المرور غير متطابقتين', en: 'Passwords do not match' },
  err_password_short:       { ar: 'كلمة المرور 6 أحرف على الأقل', en: 'Password must be at least 6 characters' },
  err_invalid_credential:   { ar: 'البريد أو كلمة المرور غلط', en: 'Incorrect email or password' },
  err_email_in_use:         { ar: 'البريد مستخدم بالفعل', en: 'Email is already in use' },
  err_weak_password:        { ar: 'كلمة المرور ضعيفة (6 أحرف+)', en: 'Password is too weak (6+ characters)' },
  err_invalid_email:        { ar: 'البريد غير صحيح', en: 'Invalid email' },
  err_too_many_requests:    { ar: 'محاولات كثيرة، حاول بعد قليل', en: 'Too many attempts, try again shortly' },
  err_network:              { ar: 'تحقق من الإنترنت', en: 'Check your internet connection' },
  err_generic:              { ar: 'حدث خطأ، حاول مجدداً', en: 'Something went wrong, please try again' },
};

export const makeT = (lang) => (key) => {
  const e = I18N[key];
  return e ? e[lang] || e.ar : key;
};
export const localeOf = (lang) => (lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US');

const AUTH_ERR = {
  'auth/invalid-credential': 'err_invalid_credential',
  'auth/user-not-found': 'err_invalid_credential',
  'auth/wrong-password': 'err_invalid_credential',
  'auth/email-already-in-use': 'err_email_in_use',
  'auth/weak-password': 'err_weak_password',
  'auth/invalid-email': 'err_invalid_email',
  'auth/too-many-requests': 'err_too_many_requests',
  'auth/network-request-failed': 'err_network',
};
export const authErrorKey = (code) => AUTH_ERR[code] || 'err_generic';

/* ───────────────────────── prices ───────────────────────── */

function fetchJsonWithTimeout(url, ms = 6000) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const id = controller ? setTimeout(() => controller.abort(), ms) : null;
  return fetch(url, controller ? { signal: controller.signal } : {})
    .then((r) => { if (id) clearTimeout(id); return r.ok ? r.json() : null; })
    .catch(() => { if (id) clearTimeout(id); return null; });
}

async function fetchCurrencyRates() {
  const d = await fetchJsonWithTimeout('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
  if (d && d.usd && d.usd.egp) return { USD: d.usd.egp, EUR: d.usd.egp / d.usd.eur, SAR: d.usd.egp / d.usd.sar };
  const d2 = await fetchJsonWithTimeout('https://open.er-api.com/v6/latest/USD');
  if (d2 && d2.rates && d2.rates.EGP) return { USD: d2.rates.EGP, EUR: d2.rates.EGP / d2.rates.EUR, SAR: d2.rates.EGP / d2.rates.SAR };
  return null;
}

async function fetchGoldSpotUSD() {
  const d = await fetchJsonWithTimeout('https://api.gold-api.com/price/XAU');
  if (d && d.price) return { oz: parseFloat(d.price) };
  const d2 = await fetchJsonWithTimeout('https://data-asg.goldprice.org/dbXRates/USD');
  if (d2 && d2.items && d2.items[0] && d2.items[0].xauPrice) return { oz: parseFloat(d2.items[0].xauPrice) };
  const d3 = await fetchJsonWithTimeout('https://api.metals.live/v1/spot/gold');
  if (d3) {
    const oz = Array.isArray(d3) ? d3[0] && d3[0].gold : d3.price;
    if (oz) return { oz: parseFloat(oz) };
  }
  return null;
}

function loadRatesCache() {
  try {
    const c = JSON.parse(lsGet(RATES_CACHE_KEY));
    return c && c.ts && c.rates && c.gold ? c : null;
  } catch (e) { return null; }
}

/* ───────────────────────── calculations ───────────────────────── */

export function calcTotals(assets, rates, gold) {
  if (!assets) return null;
  const gEGP = (assets.g24 || 0) * (gold.g24 || 0) + (assets.g21 || 0) * (gold.g21 || 0);
  const cEGP =
    (assets.sar || 0) * (rates.SAR || 13.5) +
    (assets.usd || 0) * (rates.USD || 50.5) +
    (assets.eur || 0) * (rates.EUR || 55.8) +
    (assets.egp || 0);
  return { gEGP, cEGP, total: gEGP + cEGP };
}

// Decides the hawl start date after a save.
// Guard: if gold prices haven't loaded yet we can't compare against Nisab, so keep the hawl as-is
// (the original code reset it to null here, which silently erased a running hawl).
export function nextNisabDate(assets, rates, gold, current, manualStr) {
  if (!gold.g24) return current;
  const totals = calcTotals(assets, rates, gold);
  const nisabEGP = NISAB * gold.g24;
  if (totals.total >= nisabEGP) {
    if (manualStr) {
      const d = new Date(manualStr + 'T00:00:00');
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    return current || new Date().toISOString();
  }
  return null;
}

export function calcZakat(assets, totals, gold, nisabDate) {
  if (!assets || !totals) return null;
  const t24 = (assets.g24 || 0) + ((assets.g21 || 0) * 21) / 24;
  const nEGP = NISAB * (gold.g24 || 0);
  const elig = nEGP > 0 && totals.total >= nEGP;
  const out = {
    t24, nEGP, elig,
    zamt: elig ? totals.total * 0.025 : 0,
    pct: nEGP > 0 ? Math.min((totals.total / nEGP) * 100, 100) : 0,
    startDate: null, dueDate: null, daysLeft: 0, hawlDone: false,
  };
  if (elig) {
    out.startDate = nisabDate ? new Date(nisabDate) : new Date();
    out.dueDate = new Date(out.startDate.getTime() + HAWL_DAYS * 864e5);
    const msLeft = out.dueDate.getTime() - Date.now();
    out.daysLeft = Math.ceil(msLeft / 864e5);
    out.hawlDone = msLeft <= 0;
  }
  return out;
}

export function formatDateDual(date, lang, t) {
  const greg = date.toLocaleDateString(localeOf(lang), { year: 'numeric', month: 'long', day: 'numeric' });
  try {
    const loc = lang === 'ar' ? 'ar-SA-u-ca-islamic-umalqura-nu-latn' : 'en-u-ca-islamic-umalqura';
    const hijri = new Intl.DateTimeFormat(loc, { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
    return greg + t('ce_suffix') + ' — ' + hijri + t('ah_suffix');
  } catch (e) {
    return greg + t('ce_suffix');
  }
}

/* ───────────────────────── hook ───────────────────────── */

export function useZakat() {
  const [lang, setLangState] = useState(() => lsGet('zakat_lang') || 'ar');
  const [user, setUser] = useState(null);
  const [guest, setGuest] = useState(() => lsGet('zakat_guest') === '1');
  const [ready, setReady] = useState(false);
  const [assets, setAssets] = useState(null);
  const [nisabDate, setNisabDate] = useState(null);
  const [rates, setRates] = useState({ USD: null, EUR: null, SAR: null });
  const [gold, setGold] = useState({ g24: null, g21: null });
  const [priceInfo, setPriceInfo] = useState({ stale: false, lastGoodTs: null, updated: null, loading: false });
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState(null); // { key, extra }

  const setLang = useCallback((l) => { setLangState(l); lsSet('zakat_lang', l); }, []);

  const flash = useCallback((key, extra = '') => {
    setStatus({ key, extra });
    setTimeout(() => setStatus((s) => (s && s.key === key ? null : s)), 3500);
  }, []);

  /* ---- guest storage ---- */
  const loadLocal = useCallback(() => {
    try {
      const a = lsGet('zakat_a');
      const d = lsGet('zakat_d');
      setAssets(a ? JSON.parse(a) : null);
      setNisabDate(d || null);
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => { if (lsGet('zakat_guest') === '1') loadLocal(); }, [loadLocal]);

  /* ---- cloud ---- */
  const loadCloud = useCallback(async (u) => {
    setSyncing(true);
    try {
      const snap = await Promise.race([
        getDoc(doc(db, 'users', u.uid)),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 7000)),
      ]);
      if (snap.exists()) {
        const d = snap.data();
        setAssets({
          g24: d.g24 || 0, g21: d.g21 || 0, sar: d.sar || 0, usd: d.usd || 0, eur: d.eur || 0, egp: d.egp || 0,
          savedAt: d.savedAt || new Date().toISOString(),
        });
        setNisabDate(d.nisabDate || null);
        flash('loaded_cloud');
      } else {
        setAssets(null); setNisabDate(null);
        flash('no_saved_data');
      }
    } catch (e) {
      flash('load_error', e.code || e.message);
    }
    setSyncing(false);
  }, [flash]);

  useEffect(() => {
    let alive = true;
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u); setGuest(false); lsDel('zakat_guest');
        await loadCloud(u);
      } else {
        setUser(null);
      }
      if (alive) setReady(true);
    });
    return () => { alive = false; unsub(); };
  }, [loadCloud]);

  /* ---- auth actions (they throw; the UI maps error codes) ---- */
  const login = useCallback(async (email, pass) => { await authReady; await signInWithEmailAndPassword(auth, email, pass); }, []);
  const register = useCallback(async (email, pass) => { await authReady; await createUserWithEmailAndPassword(auth, email, pass); }, []);
  const enterGuest = useCallback(() => { setGuest(true); lsSet('zakat_guest', '1'); loadLocal(); }, [loadLocal]);
  const logout = useCallback(async () => {
    try { if (auth.currentUser) await signOut(auth); } catch (e) { /* ignore */ }
    setGuest(false); lsDel('zakat_guest');
    setUser(null); setAssets(null); setNisabDate(null);
  }, []);

  /* ---- prices ---- */
  const refreshRates = useCallback(async (force) => {
    const cache = loadRatesCache();
    if (!force && cache && Date.now() - cache.ts < RATES_CACHE_TTL) {
      setRates(cache.rates); setGold(cache.gold);
      setPriceInfo({ stale: false, lastGoodTs: null, updated: cache.ts, loading: false });
      return;
    }
    setPriceInfo((p) => ({ ...p, loading: true }));
    const [curRes, goldRes] = await Promise.all([fetchCurrencyRates(), fetchGoldSpotUSD()]);
    let stale = false;
    let nr; let ng;
    if (curRes) nr = { USD: curRes.USD, EUR: curRes.EUR, SAR: curRes.SAR };
    else if (cache && cache.rates && cache.rates.USD) { nr = cache.rates; stale = true; }
    else { nr = { USD: 50.5, EUR: 55.8, SAR: 13.5 }; stale = true; }
    if (goldRes && goldRes.oz && nr.USD) {
      const g24 = (goldRes.oz / 31.1035) * nr.USD;
      ng = { g24, g21: g24 * (21 / 24) };
    } else if (cache && cache.gold && cache.gold.g24) { ng = cache.gold; stale = true; }
    else { ng = { g24: 6691, g21: 5855 }; stale = true; }
    setRates(nr); setGold(ng);
    setPriceInfo({ stale, lastGoodTs: cache ? cache.ts : null, updated: Date.now(), loading: false });
    if (!stale) lsSet(RATES_CACHE_KEY, JSON.stringify({ rates: nr, gold: ng, ts: Date.now() }));
  }, []);

  useEffect(() => {
    refreshRates(false);
    const id = setInterval(() => refreshRates(false), RATES_CACHE_TTL);
    return () => clearInterval(id);
  }, [refreshRates]);

  /* ---- save ---- */
  const persist = useCallback(async (nextAssets, nextNisab) => {
    if (user) {
      setSyncing(true);
      try {
        await setDoc(doc(db, 'users', user.uid), {
          g24: nextAssets.g24, g21: nextAssets.g21, sar: nextAssets.sar,
          usd: nextAssets.usd, eur: nextAssets.eur, egp: nextAssets.egp,
          nisabDate: nextNisab || null, savedAt: nextAssets.savedAt,
        });
        flash('saved_cloud');
      } catch (e) {
        flash('save_error', e.code || e.message);
      }
      setSyncing(false);
    } else {
      lsSet('zakat_a', JSON.stringify(nextAssets));
      if (nextNisab) lsSet('zakat_d', nextNisab); else lsDel('zakat_d');
      flash('saved_local');
    }
  }, [user, flash]);

  const saveAssets = useCallback(async (form, manualDateStr) => {
    const next = {
      g24: parseFloat(form.g24) || 0, g21: parseFloat(form.g21) || 0,
      sar: parseFloat(form.sar) || 0, usd: parseFloat(form.usd) || 0,
      eur: parseFloat(form.eur) || 0, egp: parseFloat(form.egp) || 0,
      savedAt: new Date().toISOString(),
    };
    const nd = nextNisabDate(next, rates, gold, nisabDate, manualDateStr);
    setAssets(next); setNisabDate(nd);
    await persist(next, nd);
  }, [rates, gold, nisabDate, persist]);

  const resetNisabStart = useCallback(async () => {
    if (!assets) { setNisabDate(null); return; }
    const nd = nextNisabDate(assets, rates, gold, null, '');
    setNisabDate(nd);
    await persist(assets, nd);
  }, [assets, rates, gold, persist]);

  /* ---- derived ---- */
  const totals = useMemo(() => calcTotals(assets, rates, gold), [assets, rates, gold]);
  const zakat = useMemo(() => calcZakat(assets, totals, gold, nisabDate), [assets, totals, gold, nisabDate]);

  return {
    lang, setLang, user, guest, ready, assets, nisabDate, rates, gold, priceInfo, syncing, status,
    totals, zakat,
    login, register, enterGuest, logout, refreshRates, saveAssets, resetNisabStart,
  };
}
