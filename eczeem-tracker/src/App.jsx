import { useState, useEffect } from "react";
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
const COL = ["#22c55e","#4ade80","#86efac","#bef264","#facc15","#fbbf24","#f59e0b","#f97316","#ef4444","#dc2626"];
const F = "'DM Sans',sans-serif";
const M = "'DM Mono',monospace";

const toKey = d => d.toISOString().slice(0,10);
const fmtD = k => {
  const d = new Date(k+"T12:00:00");
  return ["zo","ma","di","wo","do","vr","za"][d.getDay()]+" "+d.getDate()+" "+["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"][d.getMonth()];
};
const calcAvg = arr => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : null;

function Slider({ cat, value, onChange }) {
  const v = value || 0;
  const c = v ? COL[v-1] : "#ccc";
  return (
    <div style={{ marginBottom: 16 }}>
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
  const [data, setData] = useState({});
  const [tab, setTab] = useState("log");
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ loc:"", scores:{}, notes:"" });
  const [toast, setToast] = useState("");
  const [showImp, setShowImp] = useState(false);
  const [impTxt, setImpTxt] = useState("");
  const [ready, setReady] = useState(false);

  const today = toKey(new Date());
  const keys = Object.keys(data).sort((a,b) => b.localeCompare(a));

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: rows } = await supabase
      .from('eczeem_entries')
      .select('*')
      .order('date', { ascending: false });
    const entries = {};
    (rows || []).forEach(row => {
      entries[row.date] = { loc: row.loc || "", scores: row.scores || {}, notes: row.notes || "" };
    });
    setData(entries);
    setReady(true);
  };

  const flash = m => { setToast(m); setTimeout(() => setToast(""), 2200); };

  const openDay = k => { setForm(data[k] || { loc:"", scores:{}, notes:"" }); setEdit(k); setTab("log"); };

  const onDateChange = k => {
    setEdit(k);
    setForm(data[k] || { loc:"", scores:{}, notes:"" });
  };

  const doSave = async () => {
    const k = edit || today;
    const { error } = await supabase
      .from('eczeem_entries')
      .upsert({
        date: k,
        loc: form.loc || null,
        scores: form.scores || {},
        notes: form.notes || "",
        updated_at: new Date().toISOString()
      }, { onConflict: 'date' });
    if (!error) {
      setData(d => ({ ...d, [k]: { ...form } }));
      flash("✅ Opgeslagen");
    } else {
      flash("❌ Opslaan mislukt");
    }
    setEdit(null);
    setTab("hist");
  };

  const doDel = async k => {
    const { error } = await supabase.from('eczeem_entries').delete().eq('date', k);
    if (!error) {
      setData(d => { const u = { ...d }; delete u[k]; return u; });
      flash("🗑️ Verwijderd");
    }
    setEdit(null);
    setTab("hist");
  };

  const doExport = async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(data, null, 2)); flash("📋 Gekopieerd naar klembord"); }
    catch { prompt("Kopieer en bewaar in Notities:", JSON.stringify(data)); }
  };

  const doImport = async () => {
    try {
      const p = JSON.parse(impTxt.trim());
      if (typeof p !== "object" || Array.isArray(p)) throw 0;
      const rows = Object.entries(p).map(([date, entry]) => ({
        date,
        loc: entry.loc || null,
        scores: entry.scores || {},
        notes: entry.notes || "",
        updated_at: new Date().toISOString()
      }));
      const { error } = await supabase.from('eczeem_entries').upsert(rows, { onConflict: 'date' });
      if (!error) {
        await loadData();
        setShowImp(false);
        setImpTxt("");
        flash("✅ " + Object.keys(p).length + " dagen geïmporteerd");
      } else {
        flash("❌ Import mislukt");
      }
    } catch { flash("❌ Ongeldige data"); }
  };

  if (!ready) return <div style={{ padding:40, textAlign:"center", fontFamily:F }}>Laden…</div>;

  const B = { background:"#fff", borderRadius:14, padding:16, marginBottom:12, border:"1px solid #e5e7eb" };
  const locIcons = { "Thuis":"🏠", "KDV":"🏫", "Opa & Oma":"👴" };

  return (
    <div style={{ minHeight:"100vh", background:"#f8f7f4", fontFamily:F }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400&display=swap" rel="stylesheet"/>
      <style>{`input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:#fff;border:2px solid #888;box-shadow:0 1px 4px #0002;cursor:pointer}`}</style>

      {toast && <div style={{ position:"fixed", top:14, left:"50%", transform:"translateX(-50%)", background:"#f0fdf4", border:"1px solid #86efac", padding:"9px 20px", borderRadius:12, fontSize:13, fontWeight:500, zIndex:99, boxShadow:"0 4px 12px #0002", fontFamily:F, whiteSpace:"nowrap" }}>{toast}</div>}

      <div style={{ background:"#fff", padding:"16px 20px", borderBottom:"1px solid #e5e7eb" }}>
        <h1 style={{ margin:0, fontSize:20, fontWeight:700, letterSpacing:-0.5 }}>🧴 Loek &middot; Eczeem Tracker</h1>
        <p style={{ margin:"4px 0 0", fontSize:12, color:"#9ca3af" }}>Dagelijks bijhouden voor huisarts / kinderarts</p>
      </div>

      <div style={{ display:"flex", background:"#fff", borderBottom:"1px solid #e5e7eb" }}>
        {[["log","Vandaag"],["hist","Logboek ("+keys.length+")"],["tips","Tips"]].map(([id,lb]) => (
          <button key={id} onClick={() => { setTab(id); setShowImp(false); if (id === "log") openDay(today); }}
            style={{ flex:1, padding:"12px 8px", border:"none", cursor:"pointer", background:tab===id?"#f8f7f4":"#fff",
              borderBottom:tab===id?"2px solid #111":"2px solid transparent", fontFamily:F, fontSize:13,
              fontWeight:tab===id?600:400, color:tab===id?"#111":"#9ca3af" }}>{lb}</button>
        ))}
      </div>

      <div style={{ padding:"16px 20px", maxWidth:480, margin:"0 auto" }}>

        {tab === "log" && <div>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, color:"#6b7280", marginBottom:6 }}>Datum</div>
            <input type="date" value={edit || today} max={today}
              onChange={e => onDateChange(e.target.value)}
              style={{ width:"100%", padding:"10px 13px", borderRadius:10, border:"1px solid #d1d5db", fontFamily:F, fontSize:15, fontWeight:600, boxSizing:"border-box", cursor:"pointer" }}/>
          </div>

          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:13, color:"#6b7280", marginBottom:8 }}>Waar slaapt Loek?</div>
            <div style={{ display:"flex", gap:8 }}>
              {LOCS.map(l => (
                <button key={l} onClick={() => setForm(f => ({ ...f, loc: f.loc === l ? "" : l }))}
                  style={{ flex:1, padding:"10px 8px", borderRadius:10, cursor:"pointer",
                    border:form.loc===l?"2px solid #111":"1px solid #d1d5db",
                    background:form.loc===l?"#111":"#fff", color:form.loc===l?"#fff":"#374151",
                    fontFamily:F, fontSize:13, fontWeight:500 }}>
                  {locIcons[l]} {l === "Opa & Oma" ? "Opa&Oma" : l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, color:"#6b7280", marginBottom:12 }}>Scores (1 = goed, 10 = ernstig)</div>
            {CATS.map(c => <Slider key={c.k} cat={c} value={form.scores[c.k]||null}
              onChange={v => setForm(f => ({ ...f, scores: { ...f.scores, [c.k]: v || undefined } }))} />)}
          </div>

          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:13, color:"#6b7280", marginBottom:6 }}>Opmerkingen</div>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Bijv. nieuw wasmiddel, krabde veel, rode plekken na bad…"
              rows={3} style={{ width:"100%", padding:12, borderRadius:10, border:"1px solid #d1d5db",
                fontFamily:F, fontSize:14, resize:"vertical", boxSizing:"border-box" }}/>
          </div>

          <button onClick={doSave} style={{ width:"100%", padding:14, borderRadius:12, border:"none",
            background:"#111", color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:F }}>
            💾 Opslaan
          </button>
          {edit && data[edit] && <button onClick={() => { if (confirm("Verwijderen?")) doDel(edit); }}
            style={{ width:"100%", padding:12, borderRadius:12, border:"1px solid #fca5a5",
              background:"#fff", color:"#ef4444", fontSize:13, fontWeight:500, cursor:"pointer",
              fontFamily:F, marginTop:8 }}>Verwijderen</button>}
        </div>}

        {tab === "hist" && <div>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            <button onClick={doExport} disabled={!keys.length}
              style={{ flex:1, padding:"10px 12px", borderRadius:10, cursor:"pointer", border:"1px solid #d1d5db",
                background:"#fff", fontFamily:F, fontSize:13, fontWeight:500, opacity:keys.length?1:.4 }}>
              📤 Exporteer
            </button>
            <button onClick={() => setShowImp(!showImp)}
              style={{ flex:1, padding:"10px 12px", borderRadius:10, cursor:"pointer",
                border:showImp?"2px solid #111":"1px solid #d1d5db",
                background:showImp?"#f8f7f4":"#fff", fontFamily:F, fontSize:13, fontWeight:500 }}>
              📥 Importeer
            </button>
          </div>

          {showImp && <div style={B}>
            <div style={{ fontSize:13, color:"#6b7280", marginBottom:8 }}>Plak hier je eerder geëxporteerde data:</div>
            <textarea value={impTxt} onChange={e => setImpTxt(e.target.value)} placeholder="Plak hier de JSON…"
              rows={4} style={{ width:"100%", padding:12, borderRadius:10, border:"1px solid #d1d5db",
                fontFamily:M, fontSize:12, resize:"vertical", boxSizing:"border-box", marginBottom:8 }}/>
            <button onClick={doImport} disabled={!impTxt.trim()}
              style={{ width:"100%", padding:10, borderRadius:10, border:"none",
                background:impTxt.trim()?"#111":"#d1d5db", color:"#fff", fontSize:13, fontWeight:600,
                cursor:"pointer", fontFamily:F }}>Importeren</button>
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
                    <span>{c.e} {c.l}</span>
                    <span style={{ fontFamily:M }}>gem. {calcAvg(filled)}</span>
                  </div>
                  <div style={{ display:"flex", gap:2, alignItems:"end", height:24 }}>
                    {vals.map((v,i) => <div key={i} style={{ flex:1, borderRadius:3,
                      height:v?Math.max(4,v/10*24):2, background:v?COL[v-1]:"#e5e7eb" }}/>)}
                  </div>
                </div>;
              })}
            </div>}

            {keys.length >= 2 && (() => {
              const la = {};
              LOCS.forEach(l => {
                const le = keys.filter(k => data[k]?.loc === l);
                if (!le.length) return;
                const sc = le.flatMap(k => CATS.filter(c => c.k !== "slaap").map(c => data[k]?.scores?.[c.k]).filter(Boolean));
                if (sc.length) la[l] = calcAvg(sc);
              });
              if (Object.keys(la).length < 2) return null;
              return <div style={B}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>🏠 Gemiddelde huid per locatie</div>
                <div style={{ display:"flex", gap:8 }}>
                  {Object.entries(la).map(([l,a]) => {
                    const c = COL[Math.round(parseFloat(a))-1];
                    return <div key={l} style={{ flex:1, textAlign:"center", padding:"10px 8px", borderRadius:10,
                      background:c+"15", border:"1px solid "+c+"44" }}>
                      <div style={{ fontSize:20, fontWeight:700, color:c, fontFamily:M }}>{a}</div>
                      <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>{l}</div>
                    </div>;
                  })}
                </div>
              </div>;
            })()}

            {keys.map(k => {
              const e = data[k], sc = CATS.filter(c => e.scores[c.k]).map(c => e.scores[c.k]);
              const a = calcAvg(sc), c = a ? COL[Math.round(a)-1] : "#d1d5db";
              return <div key={k} onClick={() => openDay(k)} style={{
                background:"#fff", borderRadius:14, padding:"14px 16px", marginBottom:8,
                cursor:"pointer", border:"1px solid #e5e7eb", display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:a?c+"22":"#f9fafb",
                  border:"2px solid "+c, display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:M, fontWeight:700, fontSize:16, color:c, flexShrink:0 }}>{a||"–"}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600 }}>{fmtD(k)}</div>
                  <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>
                    {e.loc||"Geen locatie"}{e.notes?" · "+e.notes.slice(0,40)+(e.notes.length>40?"…":""):""}
                  </div>
                </div>
                <span style={{ color:"#ccc", fontSize:11 }}>▸</span>
              </div>;
            })}
          </>}
        </div>}

        {tab === "tips" && <div style={{ lineHeight:1.7, fontSize:14, color:"#374151" }}>
          <div style={B}>
            <div style={{ fontWeight:700, marginBottom:8 }}>📝 Tips voor bijhouden</div>
            <p style={{ margin:"0 0 8px" }}>Vul de tracker het liefst op een vast moment in, bijvoorbeeld 's avonds na het slapengaan. Zo vergeet je het niet en is de vergelijking per dag eerlijker.</p>
            <p style={{ margin:"0 0 8px" }}>Noteer bij "opmerkingen" alles wat afwijkt: ander wasmiddel, warm weer, zwembad, nieuw voedingsmiddel, vaccinatie, ziek geweest.</p>
            <p style={{ margin:0 }}>Na 2–3 weken heb je genoeg data om patronen te zien. Laat de huisarts vooral de vergelijking thuis vs. KDV zien.</p>
          </div>
          <div style={B}>
            <div style={{ fontWeight:700, marginBottom:8 }}>🧴 Insmeerroutine</div>
            <p style={{ margin:"0 0 8px" }}>Minimaal 2x per dag, vaker mag altijd. Direct na het bad op nog vochtige huid werkt het beste, dan sluit je het vocht in.</p>
            <p style={{ margin:0 }}>Gebruik een parfumvrije, vette crème (Cerave, La Roche-Posay Lipikar, of gewoon vaseline als basis). Smeer ruim, ook op plekken die er goed uitzien.</p>
          </div>
          <div style={B}>
            <div style={{ fontWeight:700, marginBottom:8 }}>🛁 Baden</div>
            <p style={{ margin:"0 0 8px" }}>Lauwwarm (niet warm), maximaal 10 minuten. Geen zeep, wel eventueel een badolie specifiek voor eczeem.</p>
            <p style={{ margin:0 }}>Dep de huid droog (niet wrijven) en smeer direct daarna in.</p>
          </div>
          <div style={B}>
            <div style={{ fontWeight:700, marginBottom:8 }}>👕 Kleding & was</div>
            <p style={{ margin:"0 0 8px" }}>Katoen direct op de huid, labels eruit knippen. Geen wol of synthetisch materiaal op blote huid.</p>
            <p style={{ margin:0 }}>Alle kleding, lakens en handdoeken opnieuw wassen zonder wasverzachter. Gebruik een mild, parfumvrij wasmiddel.</p>
          </div>
          <div style={B}>
            <div style={{ fontWeight:700, marginBottom:8 }}>🏫 Opvang checklist</div>
            <p style={{ margin:"0 0 8px" }}>Eigen billendoekjes meegeven (of water + watten). Vraag na welke handzeep, zonnebrand en wasverzachter de opvang gebruikt voor slabben en handdoeken.</p>
            <p style={{ margin:0 }}>Geef een tube crème mee met duidelijke instructie: minstens 1x per dag insmeren, liefst na het verschonen.</p>
          </div>
          <div style={{ background:"#fffbeb", borderRadius:14, padding:16, marginTop:4, border:"1px solid #fcd34d" }}>
            <div style={{ fontWeight:700, marginBottom:8 }}>💡 Data veiligstellen</div>
            <p style={{ margin:0 }}>Je data wordt automatisch opgeslagen in de cloud en is beschikbaar op alle apparaten. Gebruik "Exporteer" als extra backup voor het geval dat.</p>
          </div>
        </div>}

      </div>
    </div>
  );
}
