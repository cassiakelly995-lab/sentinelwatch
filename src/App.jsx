import { useState, useEffect } from "react";

const API = "http://localhost:5000";

const INIT_KEYWORDS = ["urgente","fatura","reunião","prazo","importante","contrato","alerta","pagamento"];
const INIT_SENDERS  = ["chefe@empresa.com","financeiro@empresa.com","cliente@parceiro.com"];
const MOCK_EMAILS = [
  { id:1, from:"chefe@empresa.com",      subject:"Reunião urgente amanhã",   body:"Precisamos discutir o contrato urgente.", time:"08:12", read:false },
  { id:2, from:"newsletter@tech.com",    subject:"Top 10 ferramentas de IA", body:"Confira as melhores ferramentas.",        time:"07:45", read:false },
  { id:3, from:"financeiro@empresa.com", subject:"Fatura vencendo hoje",     body:"Pagamento da fatura pendente.",           time:"06:30", read:false },
  { id:4, from:"amigo@pessoal.com",      subject:"Fim de semana?",           body:"Vamos sair no sábado?",                  time:"05:00", read:true  },
  { id:5, from:"cliente@parceiro.com",   subject:"Prazo do projeto",         body:"Confirmação do prazo final.",            time:"04:15", read:false },
  { id:6, from:"rh@empresa.com",         subject:"Aviso importante: férias", body:"Calendário de férias atualizado.",       time:"03:00", read:false },
];

function GaugeBar({ value, label, color }) {
  const c = value > 85 ? "#ef4444" : value > 65 ? "#f59e0b" : color;
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
        <span style={{ fontSize:11, color:"#94a3b8", letterSpacing:"0.08em", textTransform:"uppercase" }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:700, color:c, fontFamily:"'IBM Plex Mono',monospace" }}>{value}%</span>
      </div>
      <div style={{ height:6, background:"#1e293b", borderRadius:3, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${value}%`, background:c, borderRadius:3, transition:"width 0.8s ease", boxShadow:`0 0 8px ${c}80` }} />
      </div>
    </div>
  );
}

function MiniChart({ history }) {
  if (!history || history.length < 2) return null;
  const max = Math.max(...history, 1);
  const w = 120, h = 36;
  const pts = history.map((v,i) => `${(i/(history.length-1))*w},${h-(v/max)*h}`).join(" ");
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round"/>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill="rgba(59,130,246,0.12)" stroke="none"/>
    </svg>
  );
}

function Pill({ children, color }) {
  return (
    <span style={{ fontSize:10, background:`rgba(${color},0.18)`, color:`rgb(${color})`, padding:"2px 7px", borderRadius:4, fontWeight:600, whiteSpace:"nowrap" }}>
      {children}
    </span>
  );
}

function EmailRow({ email, keywords, senders }) {
  const vip = senders.includes(email.from);
  const kw  = keywords.some(k => (email.subject+" "+email.body).toLowerCase().includes(k));
  const hi  = vip || kw;
  return (
    <div style={{ padding:"11px 13px", marginBottom:7, borderRadius:8, background: hi ? "rgba(234,179,8,0.07)" : "rgba(255,255,255,0.03)", border:`1px solid ${hi ? "rgba(234,179,8,0.25)" : "rgba(255,255,255,0.06)"}` }}>
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
        {!email.read && <span style={{ width:6, height:6, borderRadius:"50%", background:"#3b82f6", flexShrink:0 }}/>}
        {hi  && <Pill color="234,179,8">ALERTA</Pill>}
        {vip && <Pill color="139,92,246">VIP</Pill>}
        <span style={{ fontSize:11, color:"#64748b", marginLeft:"auto" }}>{email.time}</span>
      </div>
      <div style={{ fontSize:13, color:"#e2e8f0", fontWeight:600, marginBottom:2 }}>{email.subject}</div>
      <div style={{ fontSize:11, color:"#64748b" }}>{email.from}</div>
    </div>
  );
}

export default function App() {
  const [tab,      setTab]      = useState("computer");
  const [metrics,  setMetrics]  = useState(null);
  const [online,   setOnline]   = useState(false);
  const [keywords, setKeywords] = useState(INIT_KEYWORDS);
  const [senders,  setSenders]  = useState(INIT_SENDERS);
  const [newKw,    setNewKw]    = useState("");
  const [newSnd,   setNewSnd]   = useState("");
  const [updated,  setUpdated]  = useState(new Date());
  const [alerts,   setAlerts]   = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const r = await fetch(`${API}/api/metrics`);
        const d = await r.json();
        setMetrics(d);
        setOnline(true);
        setUpdated(new Date());
        if (d.cpu?.percent > 80) {
          const hhmm = new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
          setAlerts(a => [{ id:Date.now(), msg:`CPU em ${d.cpu.percent}% — pico detectado`, type:"warn", time:hhmm }, ...a.slice(0,19)]);
        }
      } catch {
        setOnline(false);
      }
    }
    fetchData();
    const iv = setInterval(fetchData, 3000);
    return () => clearInterval(iv);
  }, []);

  const cpu    = metrics?.cpu?.percent    ?? 0;
  const memory = metrics?.memory?.percent ?? 0;
  const disk   = metrics?.disk?.percent   ?? 0;
  const cpuHist = metrics?.cpu?.history   ?? [0];
  const procs   = metrics?.processes      ?? [];
  const conns   = metrics?.connections    ?? [];

  const unreadAll = MOCK_EMAILS.filter(e => !e.read);
  const urgent    = MOCK_EMAILS.filter(e => !e.read && (senders.includes(e.from) || keywords.some(k => e.subject.toLowerCase().includes(k))));

  const card  = { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:18 };
  const ct    = { fontSize:11, textTransform:"uppercase", letterSpacing:"0.1em", color:"#475569", marginBottom:14, fontWeight:600 };
  const inp   = { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"6px 10px", color:"#e2e8f0", fontSize:12, outline:"none", width:170 };
  const btn   = { background:"rgba(59,130,246,0.2)", border:"1px solid rgba(59,130,246,0.3)", color:"#60a5fa", borderRadius:6, padding:"6px 13px", cursor:"pointer", fontSize:12, fontWeight:600 };
  const tabSt = (a) => ({ padding:"8px 18px", borderRadius:"8px 8px 0 0", border:"none", cursor:"pointer", fontSize:13, fontWeight:600, background: a ? "rgba(59,130,246,0.15)" : "transparent", color: a ? "#60a5fa" : "#64748b", borderBottom: a ? "2px solid #3b82f6" : "2px solid transparent", transition:"all 0.2s" });

  const addKw  = () => { if(newKw.trim())  { setKeywords(k=>[...k,newKw.trim()]);  setNewKw("");  }};
  const addSnd = () => { if(newSnd.trim()) { setSenders(s=>[...s,newSnd.trim()]); setNewSnd(""); }};

  return (
    <div style={{ minHeight:"100vh", padding:24 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:800, color:"#f1f5f9", letterSpacing:"-0.02em" }}>⬡ SentinelWatch</div>
          <div style={{ fontSize:11, color:"#475569", marginTop:2, letterSpacing:"0.1em", textTransform:"uppercase" }}>
            Monitor de Sistema — {metrics?.platform ?? "..."} · Uptime: {metrics?.uptime ?? "..."}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:11, color:"#475569" }}>Última atualização</div>
            <div style={{ fontSize:12, color:"#64748b", fontFamily:"'IBM Plex Mono',monospace" }}>{updated.toLocaleTimeString("pt-BR")}</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, background: online ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border:`1px solid ${online ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, padding:"6px 12px", borderRadius:8 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background: online ? "#22c55e" : "#ef4444", animation:"pulse 2s infinite", display:"inline-block" }}/>
            <span style={{ fontSize:12, color: online ? "#22c55e" : "#ef4444", fontWeight:600 }}>{online ? "ONLINE" : "OFFLINE"}</span>
          </div>
        </div>
      </div>

      {/* Aviso se offline */}
      {!online && (
        <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"12px 16px", marginBottom:20, fontSize:13, color:"#fca5a5" }}>
          ⚠️ Servidor offline — abra o CMD e rode: <span style={{ fontFamily:"monospace", background:"rgba(0,0,0,0.3)", padding:"2px 8px", borderRadius:4 }}>python server.py</span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"CPU",              val:`${cpu}%`,    icon:"⚡", col: cpu>80?"239,68,68":"59,130,246" },
          { label:"Memória",          val:`${memory}%`, icon:"🧠", col: memory>85?"239,68,68":"139,92,246" },
          { label:"Disco",            val:`${disk}%`,   icon:"💾", col: disk>85?"239,68,68":"16,185,129" },
          { label:"E-mails Urgentes", val:urgent.length, icon:"⚠️", col:"234,179,8" },
        ].map(s=>(
          <div key={s.label} style={{ ...card, display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:22 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:22, fontWeight:800, color:`rgb(${s.col})`, fontFamily:"'IBM Plex Mono',monospace", lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, borderBottom:"1px solid rgba(255,255,255,0.06)", marginBottom:18 }}>
        {[["computer","🖥 Computador"],["email","📧 E-mails"],["alerts",`🔔 Alertas (${alerts.length})`]].map(([id,lbl])=>(
          <button key={id} style={tabSt(tab===id)} onClick={()=>setTab(id)}>{lbl}</button>
        ))}
      </div>

      {/* Tab: Computer */}
      {tab==="computer" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {/* Recursos */}
          <div style={card}>
            <div style={ct}>Recursos do Sistema</div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <span style={{ fontSize:12, color:"#64748b" }}>CPU — histórico</span>
              <MiniChart history={cpuHist}/>
            </div>
            <GaugeBar value={cpu}    label="CPU"         color="#3b82f6"/>
            <GaugeBar value={memory} label="Memória RAM" color="#8b5cf6"/>
            <GaugeBar value={disk}   label="Disco"       color="#10b981"/>
            <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize:11, color:"#475569", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.08em" }}>Rede</div>
              <div style={{ display:"flex", gap:20 }}>
                <div>
                  <div style={{ fontSize:11, color:"#64748b" }}>Upload</div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#3b82f6", fontFamily:"'IBM Plex Mono',monospace" }}>{metrics?.network?.upload_mbps ?? 0} MB/s</div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:"#64748b" }}>Download</div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#10b981", fontFamily:"'IBM Plex Mono',monospace" }}>{metrics?.network?.download_mbps ?? 0} MB/s</div>
                </div>
                {metrics?.memory && (
                  <div>
                    <div style={{ fontSize:11, color:"#64748b" }}>RAM usada</div>
                    <div style={{ fontSize:14, fontWeight:700, color:"#8b5cf6", fontFamily:"'IBM Plex Mono',monospace" }}>{metrics.memory.used_gb}GB / {metrics.memory.total_gb}GB</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Processos */}
          <div style={card}>
            <div style={ct}>Processos Ativos (Top CPU)</div>
            {procs.length === 0 && <div style={{ color:"#475569", fontSize:12 }}>Aguardando dados...</div>}
            {procs.map((p,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <div>
                  <span style={{ fontSize:12, color:"#cbd5e1", fontFamily:"'IBM Plex Mono',monospace" }}>{p.name}</span>
                  <span style={{ fontSize:10, color:"#475569", marginLeft:6 }}>PID {p.pid}</span>
                </div>
                <div style={{ display:"flex", gap:16 }}>
                  <span style={{ fontSize:11, color: p.cpu>15?"#f59e0b":"#64748b" }}>CPU {p.cpu}%</span>
                  <span style={{ fontSize:11, color:"#64748b" }}>{p.mem} MB</span>
                </div>
              </div>
            ))}
          </div>

          {/* Conexões */}
          <div style={{ ...card, gridColumn:"1 / -1" }}>
            <div style={ct}>Conexões de Rede Ativas</div>
            {conns.length === 0 && <div style={{ color:"#475569", fontSize:12 }}>Nenhuma conexão ativa detectada.</div>}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
              {conns.map((c,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px", borderRadius:6, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.04)" }}>
                  <div>
                    <div style={{ fontSize:12, color:"#cbd5e1", fontFamily:"'IBM Plex Mono',monospace" }}>{c.host}</div>
                    <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>{c.ip}:{c.port}</div>
                  </div>
                  <Pill color="34,197,94">{c.status}</Pill>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Email */}
      {tab==="email" && (
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:14 }}>
          <div style={card}>
            <div style={ct}>Caixa de Entrada</div>
            {MOCK_EMAILS.map(e=>(
              <EmailRow key={e.id} email={e} keywords={keywords} senders={senders}/>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={card}>
              <div style={ct}>Palavras-chave</div>
              <div style={{ display:"flex", gap:6, marginBottom:12 }}>
                <input style={inp} value={newKw} onChange={e=>setNewKw(e.target.value)} placeholder="nova palavra..." onKeyDown={e=>e.key==="Enter"&&addKw()}/>
                <button style={btn} onClick={addKw}>+</button>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {keywords.map(k=>(
                  <div key={k} style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(234,179,8,0.1)", border:"1px solid rgba(234,179,8,0.2)", borderRadius:6, padding:"3px 8px" }}>
                    <span style={{ fontSize:11, color:"#fbbf24" }}>{k}</span>
                    <button onClick={()=>setKeywords(ks=>ks.filter(x=>x!==k))} style={{ background:"none", border:"none", color:"#64748b", cursor:"pointer", fontSize:12, padding:0, lineHeight:1 }}>×</button>
                  </div>
                ))}
              </div>
            </div>
            <div style={card}>
              <div style={ct}>Remetentes VIP</div>
              <div style={{ display:"flex", gap:6, marginBottom:12 }}>
                <input style={inp} value={newSnd} onChange={e=>setNewSnd(e.target.value)} placeholder="email@dominio.com" onKeyDown={e=>e.key==="Enter"&&addSnd()}/>
                <button style={btn} onClick={addSnd}>+</button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {senders.map(s=>(
                  <div key={s} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(139,92,246,0.08)", border:"1px solid rgba(139,92,246,0.15)", borderRadius:6, padding:"5px 10px" }}>
                    <span style={{ fontSize:11, color:"#a78bfa", fontFamily:"'IBM Plex Mono',monospace" }}>{s}</span>
                    <button onClick={()=>setSenders(ss=>ss.filter(x=>x!==s))} style={{ background:"none", border:"none", color:"#64748b", cursor:"pointer", fontSize:14, padding:0 }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Alerts */}
      {tab==="alerts" && (
        <div style={card}>
          <div style={ct}>Histórico de Alertas</div>
          {alerts.length === 0 && <div style={{ color:"#475569", fontSize:13 }}>Nenhum alerta ainda. O sistema está monitorando...</div>}
          {alerts.map(a=>(
            <div key={a.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize:16 }}>{a.type==="warn"?"⚠️":a.type==="email"?"📧":"📁"}</span>
              <span style={{ fontSize:13, color:"#cbd5e1", flex:1 }}>{a.msg}</span>
              <span style={{ fontSize:11, color:"#475569", fontFamily:"'IBM Plex Mono',monospace" }}>{a.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
