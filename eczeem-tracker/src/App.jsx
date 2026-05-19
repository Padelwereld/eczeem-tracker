import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const LOCS = ["Thuis", "KDV", "Opa & Oma"];
const CATS = [
  { k: "hoofd", l: "Hoofd (berg)", e: "🧒" },
  { k: "armen", l: "Armen", e: "💪" },
  { k: "benen", l: "Benen", e: "🦵" },
  { k: "buik", l: "Buik", e: "🟡" },
  { k: "luier", l: "Luiergebied", e: "🩲" },
  { k: "slaap", l: "Slaapkwaliteit", e: "😴" },
];
const TREATMENTS = ["Cerave","La Roche-Posay","Vaseline","Protopic","Hydrocortison","Andere"];
const TRIGGERS = [
  { k:"zwembad", l:"Zwembad", e:"🏊" },
  { k:"warmweer", l:"Warm weer", e:"🌡️" },
  { k:"nieuwvoedsel", l:"Nieuw voedsel", e:"🍓" },
  { k:"vaccinatie", l:"Vaccinatie", e:"💉" },
  { k:"ziek", l:"Ziek", e:"🤧" },
  { k:"wasmiddel", l:"Nieuw wasmiddel", e:"🧺" },
  { k:"huisdier", l:"Huisdier", e:"🐱" },
];
const COL = ["#22c55e","#4ade80","#86efac","#bef264","#facc15","#fbbf24","#f59e0b","#f97316","#ef4444","#dc2626"];
const F = "'DM Sans',sans-serif";
const M = "'DM Mono',monospace";
const BLANK = { loc:"", scores:{}, notes:"", treatments:[], triggers:[], photo_url:null };

const toKey = d => d.toISOString().slice(0,10);
const fmtD = k => {
  const d = new Date(k+"T12:00:00");
  return ["zo","ma","di","wo","do","vr","za"][d.getDay()]+" "+d.getDate()+" "+["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"][d.getMonth()];
};
const calcAvg = arr => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : null;
const toggleChip = (arr, val) => arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const handle = async e => {
    e.preventDefault();
    setLoading(true); setError(""); setMsg("");
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("Verkeerd e-mailadres of wachtwoord");
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMsg("Check je e-mail voor een bevestigingslink.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f8f7f4", fontFamily:F, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400&display=swap" rel="stylesheet"/>
      <div style={{ background:"#fff", borderRadius:20, padding:32, width:"100%", maxWidth:380, border:"1px solid #e5e7eb" }}>
        <h1 style={{ margin:"0 0 4px", fontSize:22, fontWeight:700 }}>🧴 Eczeem Tracker</h1>
        <p style={{ margin:"0 0 28px", fontSize:13, color:"#9ca3af" }}>Dagelijkse bijhouder voor je kindje</p>
        <form onSubmit={handle}>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:13, color:"#6b7280", display:"block", marginBottom:4 }}>E-mailadres</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
              style={{ width:"100%", padding:"11px 13px", borderRadius:10, border:"1px solid #d1d5db", fontFamily:F, fontSize:14, boxSizing:"border-box", outline:"none" }}/>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:13, color:"#6b7280", display:"block", marginBottom:4 }}>Wachtwoord</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              style={{ width:"100%", padding:"11px 13px", borderRadius:10, border:"1px solid #d1d5db", fontFamily:F, fontSize:14, boxSizing:"border-box", outline:"none" }}/>
          </div>
          {error && <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:8, padding:"9px 12px", fontSize:13, color:"#dc2626", marginBottom:12 }}>{error}</div>}
          {msg && <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:8, padding:"9px 12px", fontSize:13, color:"#16a34a", marginBottom:12 }}>{msg}</div>}
          <button type="submit" disabled={loading}
            style={{ width:"100%", padding:13, borderRadius:12, border:"none", background:"#111", color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:F, opacity:loading?0.6:1 }}>
            {loading ? "Even wachten…" : mode === "login" ? "Inloggen" : "Account aanmaken"}
          </button>
        </form>
        <button onClick={() => { setMode(m => m==="login"?"register":"login"); setError(""); setMsg(""); }}
          style={{ width:"100%", padding:10, marginTop:8, borderRadius:12, border:"none", background:"transparent", color:"#6b7280", fontSize:13, cursor:"pointer", fontFamily:F }}>
          {mode === "login" ? "Nog geen account? Aanmaken" : "Al een account? Inloggen"}
        </button>
      </div>
    </div>
  );
}

function Onboarding({ onSave }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('profiles').insert({ id: user.id, child_name: name.trim() });
    onSave(name.trim());
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f8f7f4", fontFamily:F, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400&display=swap" rel="stylesheet"/>
      <div style={{ background:"#fff", borderRadius:20, padding:32, width:"100%", maxWidth:380, border:"1px solid #e5e7eb" }}>
        <div style={{ fontSize:48, textAlign:"center", marginBottom:12 }}>🧴</div>
        <h1 style={{ margin:"0 0 8px", fontSize:22, fontWeight:700, textAlign:"center" }}>Welkom!</h1>
        <p style={{ margin:"0 0 28px", fontSize:14, color:"#6b7280", textAlign:"center" }}>Wat is de naam van je kindje?</p>
        <form onSubmit={handle}>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Bijv. Emma, Thomas, Sara…" required autoFocus
            style={{ width:"100%", padding:"11px 13px", borderRadius:10, border:"1px solid #d1d5db", fontFamily:F, fontSize:16, boxSizing:"border-box", marginBottom:16, outline:"none" }}/>
          <button type="submit" disabled={loading || !name.trim()}
            style={{ width:"100%", padding:13, borderRadius:12, border:"none",
              background:name.trim()?"#111":"#d1d5db", color:"#fff", fontSize:15, fontWeight:600,
              cursor:name.trim()?"pointer":"not-allowed", fontFamily:F }}>
            {loading ? "Even wachten…" : "Doorgaan →"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Slider({ cat, value, onChange }) {
  const v = value || 0;
  const c = v ? COL[v-1] : "#ccc";
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
        <span style={{ fontSize:14, fontFamily:F, color:"#374151" }}>{cat.e} {cat.l}</span>
        <span style={{ fontSize:13, fontWeight:700, color:v?c:"#9ca3af", background:v?c+"22":"#f3f4f6", padding:"2px 10px", borderRadius:12, fontFamily:M }}>{v||"–"}/10</span>
      </div>
      <input type="range" min="0" max="10" step="1" value={v}
        onChange={e => onChange(parseInt(e.target.value)||null)}
        style={{ width:"100%", height:6, WebkitAppearance:"none", appearance:"none", borderRadius:3,
          background:`linear-gradient(to right,${c} ${v*10}%,#e5e7eb ${v*10}%)`, cursor:"pointer" }}/>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#aaa", marginTop:2, fontFamily:F }}>
        <span>goed</span><span>matig</span><span>ernstig</span>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined);
  const [childName, setChildName] = useState(null);
  const [data, setData] = useState({});
  const [photoUrls, setPhotoUrls] = useState({});
  const [tab, setTab] = useState("log");
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [toast, setToast] = useState("");
  const [showImp, setShowImp] = useState(false);
  const [impTxt, setImpTxt] = useState("");
  const [ready, setReady] = useState(false);
  const [reportPeriod, setReportPeriod] = useState(14);
  const photoInputRef = useRef(null);

  const today = toKey(new Date());
  const keys = Object.keys(data).sort((a,b) => b.localeCompare(a));

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadProfile();
    else if (session === null) { setChildName(null); setData({}); setReady(false); }
  }, [session]);

  const loadProfile = async () => {
    const { data: profile } = await supabase.from('profiles').select('child_name').single();
    if (profile) { setChildName(profile.child_name); loadData(); }
    else setChildName("");
  };

  const loadData = async () => {
    const { data: rows } = await supabase.from('eczeem_entries').select('*').order('date', { ascending: false });
    const entries = {};
    const photoPaths = [];
    (rows || []).forEach(row => {
      entries[row.date] = {
        loc: row.loc || "", scores: row.scores || {}, notes: row.notes || "",
        treatments: row.treatments || [], triggers: row.triggers || [], photo_url: row.photo_url || null,
      };
      if (row.photo_url) photoPaths.push({ date: row.date, path: row.photo_url });
    });
    setData(entries);
    if (photoPaths.length > 0) {
      const urlMap = {};
      await Promise.all(photoPaths.map(async ({ date, path }) => {
        const { data: u } = await supabase.storage.from('photos').createSignedUrl(path, 86400);
        if (u?.signedUrl) urlMap[date] = u.signedUrl;
      }));
      setPhotoUrls(urlMap);
    }
    setReady(true);
  };

  const flash = m => { setToast(m); setTimeout(() => setToast(""), 2200); };

  const getSignedUrl = async (path, date) => {
    if (photoUrls[date]) return photoUrls[date];
    const { data: u } = await supabase.storage.from('photos').createSignedUrl(path, 86400);
    if (u?.signedUrl) { setPhotoUrls(prev => ({ ...prev, [date]: u.signedUrl })); return u.signedUrl; }
    return null;
  };

  const openDay = async k => {
    const entry = data[k] || BLANK;
    setForm({ ...BLANK, ...entry });
    setEdit(k);
    setTab("log");
    if (entry.photo_url) {
      const url = await getSignedUrl(entry.photo_url, k);
      setPhotoPreview(url);
    } else {
      setPhotoPreview(null);
    }
  };

  const onDateChange = async k => {
    setEdit(k);
    const entry = data[k] || BLANK;
    setForm({ ...BLANK, ...entry });
    if (entry.photo_url) {
      const url = await getSignedUrl(entry.photo_url, k);
      setPhotoPreview(url);
    } else {
      setPhotoPreview(null);
    }
  };

  const handlePhotoChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const k = edit || today;
    setPhotoPreview(URL.createObjectURL(file));
    const { data: { user } } = await supabase.auth.getUser();
    const path = `${user.id}/${k}`;
    const { error } = await supabase.storage.from('photos').upload(path, file, { upsert: true, contentType: file.type });
    if (!error) setForm(f => ({ ...f, photo_url: path }));
    else { setPhotoPreview(null); flash("❌ Foto upload mislukt"); }
    e.target.value = "";
  };

  const removePhoto = async () => {
    if (form.photo_url) await supabase.storage.from('photos').remove([form.photo_url]);
    setForm(f => ({ ...f, photo_url: null }));
    setPhotoPreview(null);
  };

  const doSave = async () => {
    const k = edit || today;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('eczeem_entries').upsert({
      user_id: user.id, date: k, loc: form.loc || null,
      scores: form.scores || {}, notes: form.notes || "",
      treatments: form.treatments || [], triggers: form.triggers || [],
      photo_url: form.photo_url || null, updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,date' });
    if (!error) { await loadData(); flash("✅ Opgeslagen"); }
    else flash("❌ Opslaan mislukt");
    setEdit(null); setForm(BLANK); setPhotoPreview(null); setTab("hist");
  };

  const doDel = async k => {
    const entry = data[k];
    if (entry?.photo_url) await supabase.storage.from('photos').remove([entry.photo_url]);
    const { error } = await supabase.from('eczeem_entries').delete().eq('date', k);
    if (!error) { await loadData(); flash("🗑️ Verwijderd"); }
    setEdit(null); setForm(BLANK); setPhotoPreview(null); setTab("hist");
  };

  const doExport = async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(data, null, 2)); flash("📋 Gekopieerd naar klembord"); }
    catch { prompt("Kopieer en bewaar:", JSON.stringify(data)); }
  };

  const doImport = async () => {
    try {
      const p = JSON.parse(impTxt.trim());
      if (typeof p !== "object" || Array.isArray(p)) throw 0;
      const { data: { user } } = await supabase.auth.getUser();
      const rows = Object.entries(p).map(([date, entry]) => ({
        user_id: user.id, date, loc: entry.loc || null,
        scores: entry.scores || {}, notes: entry.notes || "",
        treatments: entry.treatments || [], triggers: entry.triggers || [],
        photo_url: entry.photo_url || null, updated_at: new Date().toISOString()
      }));
      const { error } = await supabase.from('eczeem_entries').upsert(rows, { onConflict: 'user_id,date' });
      if (!error) { await loadData(); setShowImp(false); setImpTxt(""); flash("✅ " + Object.keys(p).length + " dagen geïmporteerd"); }
      else flash("❌ Import mislukt");
    } catch { flash("❌ Ongeldige data"); }
  };

  const generateReport = () => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - reportPeriod);
    const rKeys = keys.filter(k => new Date(k+"T12:00:00") >= cutoff);
    const skinCats = CATS.filter(c => c.k !== "slaap");
    const from = rKeys[rKeys.length-1], to = rKeys[0];
    let t = `ECZEEM RAPPORT - ${childName}\nPeriode: ${from?fmtD(from):"–"} t/m ${to?fmtD(to):"–"} (${rKeys.length} dagen)\n\n`;
    t += `SCORES PER LICHAAMSGEBIED:\n`;
    CATS.forEach(c => { const v = rKeys.map(k=>data[k]?.scores?.[c.k]).filter(Boolean); if(v.length) t+=`${c.e} ${c.l}: ${calcAvg(v)}/10\n`; });
    const all = rKeys.flatMap(k=>skinCats.map(c=>data[k]?.scores?.[c.k]).filter(Boolean));
    if(all.length) t+=`\nTOTAAL HUIDGEMIDDELDE: ${calcAvg(all)}/10\n`;
    const da = rKeys.map(k=>{const s=skinCats.map(c=>data[k]?.scores?.[c.k]).filter(Boolean);return{k,a:parseFloat(calcAvg(s)||0)};}).filter(d=>d.a>0).sort((a,b)=>a.a-b.a);
    if(da.length){t+=`\nBESTE DAG: ${fmtD(da[0].k)} (${da[0].a.toFixed(1)}) — ${data[da[0].k]?.loc||""}\n`;t+=`SLECHTSTE DAG: ${fmtD(da[da.length-1].k)} (${da[da.length-1].a.toFixed(1)}) — ${data[da[da.length-1].k]?.loc||""}\n`;}
    const la={};LOCS.forEach(l=>{const le=rKeys.filter(k=>data[k]?.loc===l);if(!le.length)return;const s=le.flatMap(k=>skinCats.map(c=>data[k]?.scores?.[c.k]).filter(Boolean));if(s.length)la[l]=calcAvg(s);});
    if(Object.keys(la).length>1){t+=`\nGEMIDDELDE PER LOCATIE:\n`;Object.entries(la).forEach(([l,a])=>{t+=`${l}: ${a}/10\n`;});}
    const tc={};rKeys.forEach(k=>(data[k]?.triggers||[]).forEach(x=>{tc[x]=(tc[x]||0)+1;}));
    if(Object.keys(tc).length){t+=`\nTRIGGERS:\n`;Object.entries(tc).sort((a,b)=>b[1]-a[1]).forEach(([k,c])=>{const tr=TRIGGERS.find(x=>x.k===k);t+=`- ${tr?.e||""} ${tr?.l||k} (${c}x)\n`;});}
    const trC={};rKeys.forEach(k=>(data[k]?.treatments||[]).forEach(x=>{trC[x]=(trC[x]||0)+1;}));
    if(Object.keys(trC).length){t+=`\nBEHANDELINGEN:\n`;Object.entries(trC).sort((a,b)=>b[1]-a[1]).forEach(([x,c])=>{t+=`- ${x} (${c}x)\n`;});}
    return t;
  };

  if (session === undefined) return <div style={{ padding:40, textAlign:"center", fontFamily:F }}>Laden…</div>;
  if (!session) return <Auth />;
  if (childName === "") return <Onboarding onSave={name => { setChildName(name); loadData(); }} />;
  if (childName === null || !ready) return <div style={{ padding:40, textAlign:"center", fontFamily:F }}>Laden…</div>;

  const B = { background:"#fff", borderRadius:14, padding:16, marginBottom:12, border:"1px solid #e5e7eb" };
  const locIcons = { "Thuis":"🏠", "KDV":"🏫", "Opa & Oma":"👴" };
  const reportCutoff = new Date(); reportCutoff.setDate(reportCutoff.getDate() - reportPeriod);
  const reportKeys = keys.filter(k => new Date(k+"T12:00:00") >= reportCutoff);

  return (
    <div style={{ minHeight:"100vh", background:"#f8f7f4", fontFamily:F }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400&display=swap" rel="stylesheet"/>
      <style>{`input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:#fff;border:2px solid #888;box-shadow:0 1px 4px #0002;cursor:pointer}`}</style>

      {toast && <div style={{ position:"fixed", top:14, left:"50%", transform:"translateX(-50%)", background:"#f0fdf4", border:"1px solid #86efac", padding:"9px 20px", borderRadius:12, fontSize:13, fontWeight:500, zIndex:99, boxShadow:"0 4px 12px #0002", fontFamily:F, whiteSpace:"nowrap" }}>{toast}</div>}

      <div style={{ background:"#fff", padding:"16px 20px", borderBottom:"1px solid #e5e7eb", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <h1 style={{ margin:0, fontSize:20, fontWeight:700, letterSpacing:-0.5 }}>🧴 {childName} · Eczeem Tracker</h1>
          <p style={{ margin:"4px 0 0", fontSize:12, color:"#9ca3af" }}>Dagelijks bijhouden voor huisarts / kinderarts</p>
        </div>
        <button onClick={() => supabase.auth.signOut()}
          style={{ padding:"6px 12px", borderRadius:8, border:"1px solid #e5e7eb", background:"#fff", fontSize:12, color:"#6b7280", cursor:"pointer", fontFamily:F, flexShrink:0 }}>
          Uitloggen
        </button>
      </div>

      <div style={{ display:"flex", background:"#fff", borderBottom:"1px solid #e5e7eb" }}>
        {[["log","Vandaag"],["hist","Logboek"],["rapport","Rapport"],["tips","Tips"]].map(([id,lb]) => (
          <button key={id} onClick={() => { setShowImp(false); setTab(id); if (id==="log") openDay(today); }}
            style={{ flex:1, padding:"12px 4px", border:"none", cursor:"pointer", background:tab===id?"#f8f7f4":"#fff",
              borderBottom:tab===id?"2px solid #111":"2px solid transparent", fontFamily:F, fontSize:12,
              fontWeight:tab===id?600:400, color:tab===id?"#111":"#9ca3af" }}>{lb}</button>
        ))}
      </div>

      <div style={{ padding:"16px 20px", maxWidth:480, margin:"0 auto" }}>

        {/* VANDAAG */}
        {tab === "log" && <div>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, color:"#6b7280", marginBottom:6 }}>Datum</div>
            <input type="date" value={edit||today} max={today} onChange={e => onDateChange(e.target.value)}
              style={{ width:"100%", padding:"10px 13px", borderRadius:10, border:"1px solid #d1d5db", fontFamily:F, fontSize:15, fontWeight:600, boxSizing:"border-box", cursor:"pointer" }}/>
          </div>

          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:13, color:"#6b7280", marginBottom:8 }}>Waar slaapt {childName}?</div>
            <div style={{ display:"flex", gap:8 }}>
              {LOCS.map(l => (
                <button key={l} onClick={() => setForm(f => ({ ...f, loc: f.loc===l?"":l }))}
                  style={{ flex:1, padding:"10px 8px", borderRadius:10, cursor:"pointer",
                    border:form.loc===l?"2px solid #111":"1px solid #d1d5db",
                    background:form.loc===l?"#111":"#fff", color:form.loc===l?"#fff":"#374151",
                    fontFamily:F, fontSize:13, fontWeight:500 }}>
                  {locIcons[l]} {l==="Opa & Oma"?"Opa&Oma":l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, color:"#6b7280", marginBottom:12 }}>Scores (1 = goed, 10 = ernstig)</div>
            {CATS.map(c => <Slider key={c.k} cat={c} value={form.scores[c.k]||null}
              onChange={v => setForm(f => ({ ...f, scores:{ ...f.scores, [c.k]:v||undefined } }))} />)}
          </div>

          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, color:"#6b7280", marginBottom:8 }}>Behandelingen gebruikt</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {TREATMENTS.map(t => {
                const sel = (form.treatments||[]).includes(t);
                return <button key={t} onClick={() => setForm(f => ({ ...f, treatments:toggleChip(f.treatments||[],t) }))}
                  style={{ padding:"6px 12px", borderRadius:20, border:sel?"2px solid #111":"1px solid #d1d5db",
                    background:sel?"#111":"#fff", color:sel?"#fff":"#374151", fontFamily:F, fontSize:12, fontWeight:500, cursor:"pointer" }}>{t}</button>;
              })}
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, color:"#6b7280", marginBottom:8 }}>Mogelijke triggers vandaag</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {TRIGGERS.map(t => {
                const sel = (form.triggers||[]).includes(t.k);
                return <button key={t.k} onClick={() => setForm(f => ({ ...f, triggers:toggleChip(f.triggers||[],t.k) }))}
                  style={{ padding:"6px 12px", borderRadius:20, border:sel?"2px solid #111":"1px solid #d1d5db",
                    background:sel?"#111":"#fff", color:sel?"#fff":"#374151", fontFamily:F, fontSize:12, fontWeight:500, cursor:"pointer" }}>
                  {t.e} {t.l}
                </button>;
              })}
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, color:"#6b7280", marginBottom:8 }}>Foto huid</div>
            {photoPreview ? (
              <div style={{ position:"relative" }}>
                <img src={photoPreview} alt="huid" style={{ width:"100%", borderRadius:12, maxHeight:220, objectFit:"cover" }}/>
                <button onClick={removePhoto}
                  style={{ position:"absolute", top:8, right:8, width:28, height:28, borderRadius:14, border:"none", background:"rgba(0,0,0,0.55)", color:"#fff", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
              </div>
            ) : (
              <button onClick={() => photoInputRef.current?.click()}
                style={{ width:"100%", padding:14, borderRadius:12, border:"2px dashed #d1d5db", background:"#fafafa", color:"#6b7280", fontSize:13, fontFamily:F, cursor:"pointer" }}>
                📷 Foto toevoegen
              </button>
            )}
            <input type="file" accept="image/*" capture="environment" ref={photoInputRef} onChange={handlePhotoChange} style={{ display:"none" }}/>
          </div>

          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:13, color:"#6b7280", marginBottom:6 }}>Opmerkingen</div>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes:e.target.value }))}
              placeholder="Bijv. krabde veel, rode plekken na bad…"
              rows={3} style={{ width:"100%", padding:12, borderRadius:10, border:"1px solid #d1d5db", fontFamily:F, fontSize:14, resize:"vertical", boxSizing:"border-box" }}/>
          </div>

          <button onClick={doSave} style={{ width:"100%", padding:14, borderRadius:12, border:"none", background:"#111", color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:F }}>
            💾 Opslaan
          </button>
          {edit && data[edit] && <button onClick={() => { if(confirm("Verwijderen?")) doDel(edit); }}
            style={{ width:"100%", padding:12, borderRadius:12, border:"1px solid #fca5a5", background:"#fff", color:"#ef4444", fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:F, marginTop:8 }}>
            Verwijderen
          </button>}
        </div>}

        {/* LOGBOEK */}
        {tab === "hist" && <div>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            <button onClick={doExport} disabled={!keys.length}
              style={{ flex:1, padding:"10px 12px", borderRadius:10, cursor:"pointer", border:"1px solid #d1d5db", background:"#fff", fontFamily:F, fontSize:13, fontWeight:500, opacity:keys.length?1:.4 }}>
              📤 Exporteer
            </button>
            <button onClick={() => setShowImp(!showImp)}
              style={{ flex:1, padding:"10px 12px", borderRadius:10, cursor:"pointer", border:showImp?"2px solid #111":"1px solid #d1d5db", background:showImp?"#f8f7f4":"#fff", fontFamily:F, fontSize:13, fontWeight:500 }}>
              📥 Importeer
            </button>
          </div>

          {showImp && <div style={B}>
            <div style={{ fontSize:13, color:"#6b7280", marginBottom:8 }}>Plak hier je eerder geëxporteerde data:</div>
            <textarea value={impTxt} onChange={e => setImpTxt(e.target.value)} placeholder="Plak hier de JSON…"
              rows={4} style={{ width:"100%", padding:12, borderRadius:10, border:"1px solid #d1d5db", fontFamily:M, fontSize:12, resize:"vertical", boxSizing:"border-box", marginBottom:8 }}/>
            <button onClick={doImport} disabled={!impTxt.trim()}
              style={{ width:"100%", padding:10, borderRadius:10, border:"none", background:impTxt.trim()?"#111":"#d1d5db", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F }}>
              Importeren
            </button>
          </div>}

          {!keys.length ? <div style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
            <div style={{ fontSize:14 }}>Nog geen registraties. Begin met "Vandaag".</div>
          </div> : <>

            {keys.length >= 3 && <div style={B}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>📊 Trend (laatste {Math.min(keys.length,14)} dagen)</div>
              {CATS.map(c => {
                const recent = keys.slice(0,14).reverse();
                const vals = recent.map(k => data[k]?.scores?.[c.k]||null);
                const filled = vals.filter(Boolean);
                if (filled.length < 2) return null;
                return <div key={c.k} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#6b7280", marginBottom:4 }}>
                    <span>{c.e} {c.l}</span><span style={{ fontFamily:M }}>gem. {calcAvg(filled)}</span>
                  </div>
                  <div style={{ display:"flex", gap:2, alignItems:"end", height:24 }}>
                    {vals.map((v,i) => <div key={i} style={{ flex:1, borderRadius:3, height:v?Math.max(4,v/10*24):2, background:v?COL[v-1]:"#e5e7eb" }}/>)}
                  </div>
                </div>;
              })}
            </div>}

            {keys.length >= 2 && (() => {
              const la = {};
              LOCS.forEach(l => {
                const le = keys.filter(k => data[k]?.loc===l);
                if (!le.length) return;
                const sc = le.flatMap(k => CATS.filter(c=>c.k!=="slaap").map(c=>data[k]?.scores?.[c.k]).filter(Boolean));
                if (sc.length) la[l] = calcAvg(sc);
              });
              if (Object.keys(la).length < 2) return null;
              return <div style={B}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>🏠 Gemiddelde huid per locatie</div>
                <div style={{ display:"flex", gap:8 }}>
                  {Object.entries(la).map(([l,a]) => {
                    const c = COL[Math.round(parseFloat(a))-1];
                    return <div key={l} style={{ flex:1, textAlign:"center", padding:"10px 8px", borderRadius:10, background:c+"15", border:"1px solid "+c+"44" }}>
                      <div style={{ fontSize:20, fontWeight:700, color:c, fontFamily:M }}>{a}</div>
                      <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>{l}</div>
                    </div>;
                  })}
                </div>
              </div>;
            })()}

            {keys.map(k => {
              const e = data[k], sc = CATS.filter(c=>e.scores[c.k]).map(c=>e.scores[c.k]);
              const a = calcAvg(sc), c = a?COL[Math.round(a)-1]:"#d1d5db";
              return <div key={k} onClick={() => openDay(k)} style={{ background:"#fff", borderRadius:14, padding:"14px 16px", marginBottom:8, cursor:"pointer", border:"1px solid #e5e7eb", display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:a?c+"22":"#f9fafb", border:"2px solid "+c, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:M, fontWeight:700, fontSize:16, color:c, flexShrink:0 }}>{a||"–"}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600 }}>{fmtD(k)}</div>
                  <div style={{ fontSize:12, color:"#6b7280", marginTop:2, display:"flex", gap:4, alignItems:"center", flexWrap:"wrap" }}>
                    <span>{e.loc||"Geen locatie"}</span>
                    {(e.triggers||[]).slice(0,3).map(t => { const tr=TRIGGERS.find(x=>x.k===t); return tr?<span key={t}>{tr.e}</span>:null; })}
                    {e.photo_url && <span>📷</span>}
                  </div>
                  {e.notes && <div style={{ fontSize:11, color:"#9ca3af", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.notes.slice(0,50)}{e.notes.length>50?"…":""}</div>}
                </div>
                <span style={{ color:"#ccc", fontSize:11 }}>▸</span>
              </div>;
            })}
          </>}
        </div>}

        {/* RAPPORT */}
        {tab === "rapport" && <div>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>📋 Artsrapport — {childName}</div>

          <div style={{ display:"flex", gap:6, marginBottom:16 }}>
            {[[7,"1 week"],[14,"2 weken"],[30,"1 maand"],[90,"3 maanden"]].map(([days,label]) => (
              <button key={days} onClick={() => setReportPeriod(days)}
                style={{ flex:1, padding:"8px 4px", borderRadius:10, border:reportPeriod===days?"2px solid #111":"1px solid #d1d5db",
                  background:reportPeriod===days?"#111":"#fff", color:reportPeriod===days?"#fff":"#374151",
                  fontFamily:F, fontSize:11, fontWeight:500, cursor:"pointer" }}>{label}</button>
            ))}
          </div>

          {reportKeys.length === 0 ? <div style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📊</div>
            <div style={{ fontSize:14 }}>Geen data voor deze periode.</div>
          </div> : <>

            <div style={B}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Gemiddelde scores ({reportKeys.length} dagen)</div>
              {CATS.map(c => {
                const vals = reportKeys.map(k => data[k]?.scores?.[c.k]).filter(Boolean);
                if (!vals.length) return null;
                const avg = parseFloat(calcAvg(vals));
                const col = COL[Math.round(avg)-1];
                return <div key={c.k} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                  <span style={{ fontSize:13, width:150, color:"#374151", flexShrink:0 }}>{c.e} {c.l}</span>
                  <div style={{ flex:1, background:"#f3f4f6", borderRadius:6, height:8 }}>
                    <div style={{ width:`${avg*10}%`, background:col, borderRadius:6, height:"100%" }}/>
                  </div>
                  <span style={{ fontFamily:M, fontSize:12, fontWeight:700, color:col, width:32, textAlign:"right" }}>{avg.toFixed(1)}</span>
                </div>;
              })}
            </div>

            {(() => {
              const tc = {};
              reportKeys.forEach(k => (data[k]?.triggers||[]).forEach(t => { tc[t]=(tc[t]||0)+1; }));
              if (!Object.keys(tc).length) return null;
              return <div style={B}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>🔍 Triggers deze periode</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {Object.entries(tc).sort((a,b)=>b[1]-a[1]).map(([k,c]) => {
                    const t = TRIGGERS.find(x=>x.k===k);
                    return <div key={k} style={{ padding:"6px 10px", borderRadius:20, background:"#f3f4f6", fontSize:12, fontFamily:F }}>
                      {t?.e} {t?.l} <strong>({c}x)</strong>
                    </div>;
                  })}
                </div>
              </div>;
            })()}

            {(() => {
              const tc = {};
              reportKeys.forEach(k => (data[k]?.treatments||[]).forEach(t => { tc[t]=(tc[t]||0)+1; }));
              if (!Object.keys(tc).length) return null;
              return <div style={B}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>🧴 Gebruikte behandelingen</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {Object.entries(tc).sort((a,b)=>b[1]-a[1]).map(([t,c]) => (
                    <div key={t} style={{ padding:"6px 10px", borderRadius:20, background:"#f0fdf4", border:"1px solid #86efac", fontSize:12, fontFamily:F }}>
                      {t} <strong>({c}x)</strong>
                    </div>
                  ))}
                </div>
              </div>;
            })()}

            <button onClick={async () => {
              const text = generateReport();
              try { await navigator.clipboard.writeText(text); flash("📋 Rapport gekopieerd!"); }
              catch { prompt("Kopieer dit rapport:", text); }
            }} style={{ width:"100%", padding:14, borderRadius:12, border:"none", background:"#111", color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:F }}>
              📋 Kopieer rapport voor arts
            </button>
          </>}
        </div>}

        {/* TIPS */}
        {tab === "tips" && <div style={{ lineHeight:1.7, fontSize:14, color:"#374151" }}>
          <div style={B}>
            <div style={{ fontWeight:700, marginBottom:8 }}>📝 Tips voor bijhouden</div>
            <p style={{ margin:"0 0 8px" }}>Vul de tracker het liefst op een vast moment in, bijvoorbeeld 's avonds na het slapengaan.</p>
            <p style={{ margin:"0 0 8px" }}>Noteer bij "opmerkingen" alles wat afwijkt: ander wasmiddel, warm weer, zwembad, nieuw voedingsmiddel, vaccinatie, ziek geweest.</p>
            <p style={{ margin:0 }}>Na 2–3 weken heb je genoeg data om patronen te zien. Laat de huisarts de vergelijking thuis vs. KDV zien.</p>
          </div>
          <div style={B}>
            <div style={{ fontWeight:700, marginBottom:8 }}>🧴 Insmeerroutine</div>
            <p style={{ margin:"0 0 8px" }}>Minimaal 2x per dag, vaker mag altijd. Direct na het bad op nog vochtige huid werkt het beste.</p>
            <p style={{ margin:0 }}>Gebruik een parfumvrije, vette crème (Cerave, La Roche-Posay Lipikar, of vaseline). Smeer ruim.</p>
          </div>
          <div style={B}>
            <div style={{ fontWeight:700, marginBottom:8 }}>🛁 Baden</div>
            <p style={{ margin:"0 0 8px" }}>Lauwwarm (niet warm), maximaal 10 minuten. Geen zeep, wel eventueel badolie voor eczeem.</p>
            <p style={{ margin:0 }}>Dep de huid droog (niet wrijven) en smeer direct daarna in.</p>
          </div>
          <div style={B}>
            <div style={{ fontWeight:700, marginBottom:8 }}>👕 Kleding & was</div>
            <p style={{ margin:"0 0 8px" }}>Katoen direct op de huid, labels eruit knippen. Geen wol of synthetisch op blote huid.</p>
            <p style={{ margin:0 }}>Was zonder wasverzachter. Gebruik mild, parfumvrij wasmiddel.</p>
          </div>
          <div style={B}>
            <div style={{ fontWeight:700, marginBottom:8 }}>🏫 Opvang checklist</div>
            <p style={{ margin:"0 0 8px" }}>Eigen billendoekjes meegeven. Vraag welke handzeep en wasverzachter de opvang gebruikt.</p>
            <p style={{ margin:0 }}>Geef een tube crème mee: minstens 1x per dag insmeren, liefst na het verschonen.</p>
          </div>
          <div style={{ background:"#fffbeb", borderRadius:14, padding:16, marginTop:4, border:"1px solid #fcd34d" }}>
            <div style={{ fontWeight:700, marginBottom:8 }}>💡 Data veiligstellen</div>
            <p style={{ margin:0 }}>Je data wordt automatisch opgeslagen in de cloud. Gebruik "Exporteer" als extra backup.</p>
          </div>
        </div>}

      </div>
    </div>
  );
}
