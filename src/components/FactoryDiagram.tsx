import React, { useState, useEffect } from "react";

// ── Station types ──
interface Station {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  modules: string[];
  whatHappens: string;
  detail: string;
  machine: string;
  pipes: string[];
}

const STATIONS: Station[] = [
  {
    id: "input",
    label: "INPUT",
    sublabel: "Gebruiker",
    color: "#4ade80",
    modules: ["Leerling · Docent · Admin", "sendMessage(tekst, profiel, sessionId)", "curriculumContext meegeven"],
    whatHappens: "Je typt een vraag. Profiel, vak, niveau, sessionId en curriculumContext worden automatisch toegevoegd.",
    detail: "Het bericht wordt verstuurd vanuit StudentStudio, TeacherCockpit of AdminPanel. Naast de tekst gaan profiel, sessionId en curriculumContext mee als metadata. Dit vormt de volledige input voor de AI-pipeline.",
    machine: "TERMINAL",
    pipes: ["right"],
  },
  {
    id: "prompt",
    label: "PROMPT",
    sublabel: "Kennislaag",
    color: "#f59e0b",
    modules: ["generateSystemPrompt()", "getEffectiveSSOT()", "whitelistMerge()", "10D rubrics", "interventies"],
    whatHappens: "Het systeem-prompt wordt samengesteld uit de SSOT die bij het opstarten is geladen. School-plugins zijn al samengevoegd via whitelistMerge().",
    detail: "De SSOT (v15.0.0) wordt bij app-bootstrap geladen door useSchoolPlugin. Per bericht roept generateSystemPrompt() het volledige 10D didactisch model op: rubrics, interventies, Socratische richtlijnen. School-overlays zijn al gemerged.",
    machine: "VAULT",
    pipes: ["left", "right"],
  },
  {
    id: "auth",
    label: "AUTH",
    sublabel: "Beveiliging",
    color: "#7c3aed",
    modules: ["getAuthToken()", "JWT validatie", "has_role() verify", "RLS enforcement"],
    whatHappens: "Je JWT-token wordt opgehaald en meegegeven. De edge function valideert je identiteit en rol server-side.",
    detail: "Vlak voor de API-call haalt getAuthToken() het JWT-token op. De edge function verifieert dit token, bepaalt de rol via has_role() SECURITY DEFINER, en dwingt RLS af op database-niveau.",
    machine: "GATE",
    pipes: ["left", "right"],
  },
  {
    id: "chat",
    label: "CHAT",
    sublabel: "eai-chat",
    color: "#00e5ff",
    modules: ["eai-chat edge fn", "Model Router", "FAST → gemini-3-flash-preview", "SLOW → gemini-2.5-pro", "streaming response"],
    whatHappens: "Je bericht wordt naar de AI gestuurd. De Model Router kiest FAST (Gemini Flash) of SLOW (Gemini Pro) op basis van kennistype en gespreksdiepte.",
    detail: "Edge Function eai-chat bevat een Model Router die FAST of SLOW selecteert op basis van intent_category. Het antwoord wordt gestreamd — je ziet het dus woord voor woord verschijnen. Het Socratisch systeem-prompt stuurt de toon en diepte.",
    machine: "REACTOR",
    pipes: ["left", "right"],
  },
  {
    id: "classify",
    label: "CLASSIFY",
    sublabel: "eai-classify",
    color: "#00e5ff",
    modules: ["eai-classify edge fn", "Gemini tool-calling", "10D: K·P·C·TD·V·E·T·S·L·B", "epistemic status"],
    whatHappens: "Na het antwoord analyseert een tweede AI-call je interactie langs 10 dimensies. Dit gebeurt NADAT je het antwoord al ziet.",
    detail: "Edge Function eai-classify draait asynchroon nadat het streaming-antwoord volledig is. Gemini analyseert via tool-calling schema elke dimensie: Kennis, Proces, Co-regulatie, Taakdichtheid, Vaardigheid, Epistemisch, Technologie, Sociaal, Transfer en Bias. Output: EAIAnalysis met cognitive_mode, srl_state en knowledge_type.",
    machine: "SCANNER",
    pipes: ["left", "right"],
  },
  {
    id: "pipeline",
    label: "PIPELINE",
    sublabel: "Reliability",
    color: "#10b981",
    modules: [
      "① VALIDATE",
      "② HEAL (SSOT-compliance)",
      "③ GUARD (epistemisch)",
    ],
    whatHappens: "De classificatie doorloopt automatische controles: schema-validatie, SSOT-compliance healing en epistemische bewaking.",
    detail: "reliabilityPipeline.ts verwerkt de classificatie-output (niet het chat-antwoord) via drie kernstappen: VALIDATE controleert het schema, HEAL dwingt SSOT-compliance af bij ontbrekende velden, en GUARD bewaakt epistemische correctheid. De initiële JSON-parsing vindt plaats vóór de pipeline.",
    machine: "PROCESSOR",
    pipes: ["left", "right"],
  },
  {
    id: "db",
    label: "DATABASE",
    sublabel: "Persistentie",
    color: "#818cf8",
    modules: ["persistChatMessage()", "analysis JSONB", "mechanical JSONB", "updateMastery()", "student_sessions"],
    whatHappens: "Alles wordt opgeslagen: je bericht, de analyse, de mechanische staat en je voortgang per leerdoel.",
    detail: "Het bericht, de EAIAnalysis en MechanicalState worden als JSONB opgeslagen in chat_messages. Mastery wordt bijgewerkt op basis van de classificatie. student_sessions houdt voortgang en status bij.",
    machine: "ARCHIVE",
    pipes: ["left", "right"],
  },
  {
    id: "output",
    label: "OUTPUT",
    sublabel: "Rol-View",
    color: "#4ade80",
    modules: ["MessageBubble render", "EAIAnalysis badge", "LeskaartPanel update", "ObservabilityPanel", "[BEELD:] tag → image gen"],
    whatHappens: "Je ziet het antwoord. Als de AI een [BEELD:] tag heeft geplaatst, wordt er automatisch een afbeelding gegenereerd.",
    detail: "Het eindantwoord wordt gerenderd in de juiste rol-view. Leerling ziet tekst + voortgang, docent ziet EAIAnalysis, admin ziet observability metrics. [BEELD:] tags worden gedetecteerd en triggeren automatische beeldgeneratie.",
    machine: "DISPLAY",
    pipes: ["left"],
  },
];

const W = 1200;
const H = 520;
const FLOOR_Y = 370;
const CEIL_Y = 60;
const ST_W = 110;
const ST_GAP = (W - 80 - STATIONS.length * ST_W) / (STATIONS.length - 1);
const ST_START = 40;

function stationX(i: number) { return ST_START + i * (ST_W + ST_GAP); }
function stationCX(i: number) { return stationX(i) + ST_W / 2; }

function hexRgb(h: string): [number, number, number] {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
  opacity: number;
}

function useParticles(count: number, speed: number): Particle[] {
  const [particles, setParticles] = useState<Particle[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (i / count) * (W - 80) + 40,
      y: FLOOR_Y + 18,
      size: 3 + Math.random() * 3,
      speed: speed * (0.8 + Math.random() * 0.4),
      color: STATIONS[Math.floor(Math.random() * STATIONS.length)].color,
      opacity: 0.6 + Math.random() * 0.4,
    }))
  );

  useEffect(() => {
    let raf: number;
    const tick = () => {
      setParticles(ps => ps.map(p => {
        let nx = p.x + p.speed;
        if (nx > W - 30) nx = 30;
        const stIdx = Math.floor((nx - 40) / (ST_W + ST_GAP));
        const color = STATIONS[Math.max(0, Math.min(stIdx, STATIONS.length - 1))].color;
        return { ...p, x: nx, color };
      }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return particles;
}

const FactoryDiagram = () => {
  const [active, setActive] = useState<number | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);
  const [tick, setTick] = useState(0);
  const particles = useParticles(28, 0.9);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 50);
    return () => clearInterval(id);
  }, []);

  // Reset technical view when switching stations
  useEffect(() => {
    setShowTechnical(false);
  }, [active]);

  const af = active !== null ? STATIONS[active] : null;

  return (
    <div className="flex flex-col items-center font-mono select-none" style={{ overflowX: "auto" }}>
      {/* Header */}
      <div className="text-center py-3">
        <div className="text-[9px] tracking-[5px] text-primary/40 mb-1">
          PRODUCTIELIJN · DWARSDOORSNEDE
        </div>
        <div className="text-2xl font-bold tracking-wider text-foreground">
          EAI<span className="text-primary">HUB</span>
          <span className="text-[11px] text-muted-foreground/30 ml-4 tracking-widest">FABRIEK</span>
        </div>
      </div>

      {/* Factory SVG */}
      <div className="w-full overflow-x-auto">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block mx-auto">
          <defs>
            <pattern id="fd-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20,0 L0,0 0,20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.3" opacity="0.4"/>
            </pattern>
            <pattern id="fd-hatch" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
              <line x1="0" y1="8" x2="8" y2="0" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
            {STATIONS.map(s => {
              const [r, g, b] = hexRgb(s.color);
              return (
                <filter key={s.id} id={`gl-${s.id}`} x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur"/>
                  <feColorMatrix in="blur" type="matrix"
                    values={`0 0 0 0 ${(r/255).toFixed(2)} 0 0 0 0 ${(g/255).toFixed(2)} 0 0 0 0 ${(b/255).toFixed(2)} 0 0 0 0.7 0`}
                    result="cb"/>
                  <feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              );
            })}
            <filter id="fd-softglow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Background */}
          <rect x="0" y="0" width={W} height={H} fill="hsl(var(--background))"/>
          <rect x="20" y={CEIL_Y - 10} width={W - 40} height={FLOOR_Y - CEIL_Y + 10} fill="url(#fd-grid)" opacity="0.8"/>

          {/* Ceiling beam */}
          <rect x="20" y={CEIL_Y - 12} width={W - 40} height="12" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1"/>
          {Array.from({ length: 24 }, (_, i) => (
            <circle key={i} cx={40 + i * ((W - 80) / 23)} cy={CEIL_Y - 6} r="2.5" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="0.5"/>
          ))}

          {/* Ceiling lights */}
          {STATIONS.map((s, i) => {
            const cx = stationCX(i);
            return (
              <g key={s.id}>
                <line x1={cx} y1={CEIL_Y - 12} x2={cx} y2={CEIL_Y + 14} stroke="hsl(var(--border))" strokeWidth="2"/>
                <ellipse cx={cx} cy={CEIL_Y + 18} rx="14" ry="5" fill={s.color} opacity={active === i ? 0.9 : 0.25} filter="url(#fd-softglow)"/>
                <polygon
                  points={`${cx - 14},${CEIL_Y + 23} ${cx + 14},${CEIL_Y + 23} ${cx + 40},${FLOOR_Y} ${cx - 40},${FLOOR_Y}`}
                  fill={s.color} opacity={active === i ? 0.06 : 0.02}/>
              </g>
            );
          })}

          {/* Floor */}
          <rect x="20" y={FLOOR_Y} width={W - 40} height="12" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1"/>
          <rect x="20" y={FLOOR_Y + 12} width={W - 40} height="30" fill="url(#fd-hatch)"/>
          {Array.from({ length: 20 }, (_, i) => (
            <circle key={i} cx={50 + i * ((W - 100) / 19)} cy={FLOOR_Y + 6} r="2" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="0.5"/>
          ))}

          {/* Conveyor belt */}
          <rect x="35" y={FLOOR_Y - 22} width={W - 70} height="22" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" rx="2"/>
          {Array.from({ length: 38 }, (_, i) => (
            <rect key={i} x={36 + i * 30} y={FLOOR_Y - 21} width="28" height="20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" rx="1"/>
          ))}

          {/* Belt particles */}
          {particles.map(p => (
            <circle key={p.id} cx={p.x} cy={p.y} r={p.size} fill={p.color} opacity={p.opacity} filter="url(#fd-softglow)"/>
          ))}

          {/* Overhead pipes */}
          {[CEIL_Y + 30, CEIL_Y + 42, CEIL_Y + 54].map((py, pi) => {
            const colors = ["#00e5ff", "#10b981", "#f59e0b"];
            const offset = ((tick * (pi + 1) * 2) % 60);
            return (
              <g key={pi}>
                <line x1="25" y1={py} x2={W - 25} y2={py} stroke={colors[pi]} strokeWidth={pi === 0 ? 3 : 2} opacity="0.25"/>
                {Array.from({ length: 8 }, (_, di) => {
                  const dx = ((offset + di * 140) % (W - 50)) + 25;
                  return (
                    <circle key={di} cx={dx} cy={py} r={pi === 0 ? 3 : 2} fill={colors[pi]} opacity="0.7" filter="url(#fd-softglow)"/>
                  );
                })}
              </g>
            );
          })}

          {/* Pipe end caps */}
          {[CEIL_Y + 30, CEIL_Y + 42, CEIL_Y + 54].map((py, pi) => (
            <g key={pi}>
              <rect x="20" y={py - 4} width="8" height="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" rx="1"/>
              <rect x={W - 28} y={py - 4} width="8" height="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" rx="1"/>
            </g>
          ))}

          {/* Stations */}
          {STATIONS.map((s, i) => {
            const sx = stationX(i);
            const cx = stationCX(i);
            const isAct = active === i;
            const [r, g, b] = hexRgb(s.color);
            const stH = 240;
            const stY = FLOOR_Y - stH - 22;

            return (
              <g key={s.id} onClick={() => setActive(active === i ? null : i)} style={{ cursor: "pointer" }}
                filter={isAct ? `url(#gl-${s.id})` : undefined}>
                {/* Support beams */}
                <rect x={sx} y={stY} width="5" height={stH + 22} fill="hsl(var(--card))" stroke={s.color} strokeWidth="0.4" opacity="0.6"/>
                <rect x={sx + ST_W - 5} y={stY} width="5" height={stH + 22} fill="hsl(var(--card))" stroke={s.color} strokeWidth="0.4" opacity="0.6"/>

                {/* Machine body */}
                <rect x={sx + 5} y={stY} width={ST_W - 10} height={stH}
                  fill={`rgba(${r},${g},${b},${isAct ? 0.14 : 0.07})`}
                  stroke={s.color} strokeWidth={isAct ? 1.5 : 0.7} rx="2"/>

                {/* Top accent bar */}
                <rect x={sx + 5} y={stY} width={ST_W - 10} height="6"
                  fill={`rgba(${r},${g},${b},${isAct ? 0.8 : 0.4})`} rx="2"/>

                {/* Screen */}
                <rect x={sx + 14} y={stY + 16} width={ST_W - 28} height={58}
                  fill="hsl(var(--background))" stroke={s.color} strokeWidth={isAct ? 1 : 0.5} rx="1" opacity="0.9"/>

                {/* Screen content */}
                {s.modules.slice(0, 4).map((m, mi) => (
                  <text key={mi} x={sx + 18} y={stY + 30 + mi * 12} fontSize="5.5" fontFamily="'Courier New', monospace"
                    fill={s.color} opacity={isAct ? 0.95 : 0.45}>
                    {m.length > 15 ? m.slice(0, 15) + "…" : m}
                  </text>
                ))}

                {/* Blinking cursor */}
                {isAct && (
                  <rect x={sx + 18} y={stY + 74} width="4" height="6"
                    fill={s.color} opacity={(Math.floor(tick / 8) % 2 === 0) ? 1 : 0}/>
                )}

                {/* Control panel */}
                <rect x={sx + 14} y={stY + 84} width={ST_W - 28} height={50}
                  fill="hsl(var(--background))" stroke={s.color} strokeWidth={isAct ? 1 : 0.5} rx="1" opacity="0.8"/>

                {/* Dials */}
                {[0, 1, 2].map(di => {
                  const dcx = sx + 24 + di * 24;
                  const dcy = stY + 100;
                  return (
                    <g key={di}>
                      <circle cx={dcx} cy={dcy} r="7" fill="hsl(var(--background))" stroke={s.color} strokeWidth="0.6" opacity={isAct ? 0.9 : 0.4}/>
                      <line x1={dcx} y1={dcy}
                        x2={dcx + 5 * Math.cos(-1.2 + di * 0.8 + tick * 0.01 * (di + 1))}
                        y2={dcy + 5 * Math.sin(-1.2 + di * 0.8 + tick * 0.01 * (di + 1))}
                        stroke={s.color} strokeWidth="1.2" opacity={isAct ? 1 : 0.5}/>
                    </g>
                  );
                })}

                {/* Status LEDs */}
                {[0, 1, 2, 3].map(li => (
                  <rect key={li} x={sx + 18 + li * 15} y={stY + 116} width="8" height="4"
                    fill={s.color}
                    opacity={isAct ? ((Math.floor(tick / 5) + li) % 4 === 0 ? 1 : 0.2) : 0.15}
                    rx="1"/>
                ))}

                {/* Vent slats */}
                {[0, 1, 2, 3, 4].map(vi => (
                  <line key={vi} x1={sx + 14} y1={stY + 148 + vi * 8} x2={sx + ST_W - 14} y2={stY + 148 + vi * 8}
                    stroke={s.color} strokeWidth="0.6" opacity={isAct ? 0.4 : 0.15}/>
                ))}

                {/* Pipe connectors */}
                {s.pipes.includes("left") && i > 0 && (
                  <g>
                    <rect x={sx} y={stY + 50} width="10" height="10" fill="hsl(var(--background))" stroke={s.color} strokeWidth="0.5" opacity="0.7"/>
                    <rect x={sx} y={stY + 80} width="10" height="8" fill="hsl(var(--background))" stroke={s.color} strokeWidth="0.5" opacity="0.5"/>
                  </g>
                )}
                {s.pipes.includes("right") && i < STATIONS.length - 1 && (
                  <g>
                    <rect x={sx + ST_W - 10} y={stY + 50} width="10" height="10" fill="hsl(var(--background))" stroke={s.color} strokeWidth="0.5" opacity="0.7"/>
                    <rect x={sx + ST_W - 10} y={stY + 80} width="10" height="8" fill="hsl(var(--background))" stroke={s.color} strokeWidth="0.5" opacity="0.5"/>
                  </g>
                )}

                {/* Station label */}
                <rect x={sx + 5} y={stY + stH - 32} width={ST_W - 10} height="32"
                  fill={`rgba(${r},${g},${b},${isAct ? 0.18 : 0.08})`}/>
                <text x={cx} y={stY + stH - 16} textAnchor="middle" fontSize="9"
                  fontFamily="'Courier New', monospace" fontWeight="700"
                  fill={s.color} opacity={isAct ? 1 : 0.7} letterSpacing="1.5">
                  {s.label}
                </text>
                <text x={cx} y={stY + stH - 5} textAnchor="middle" fontSize="6"
                  fontFamily="'Courier New', monospace"
                  fill={s.color} opacity={isAct ? 0.7 : 0.35} letterSpacing="0.5">
                  {s.sublabel}
                </text>

                {/* Machine type tag */}
                <text x={cx} y={stY - 6} textAnchor="middle" fontSize="6"
                  fontFamily="'Courier New', monospace"
                  fill={s.color} opacity={isAct ? 0.8 : 0.3} letterSpacing="2">
                  {s.machine}
                </text>
              </g>
            );
          })}

          {/* Connection ducts */}
          {STATIONS.slice(0, -1).map((s, i) => {
            const x1 = stationX(i) + ST_W;
            const x2 = stationX(i + 1);
            const y1d = FLOOR_Y - 22 - 200 + 54;
            const y2d = FLOOR_Y - 22 - 200 + 64;
            const nextColor = STATIONS[i + 1].color;
            const animated = ((tick * 2.5) % (x2 - x1));
            return (
              <g key={i}>
                <line x1={x1} y1={y1d} x2={x2} y2={y1d} stroke={s.color} strokeWidth="2" opacity="0.3"/>
                <line x1={x1} y1={y2d} x2={x2} y2={y2d} stroke={nextColor} strokeWidth="1.5" opacity="0.25"/>
                <circle cx={x1 + animated} cy={y1d} r="2.5" fill={s.color} opacity="0.8" filter="url(#fd-softglow)"/>
              </g>
            );
          })}

          {/* Walls */}
          <rect x="0" y={CEIL_Y - 22} width="22" height={FLOOR_Y - CEIL_Y + 42} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1"/>
          <rect x={W - 22} y={CEIL_Y - 22} width="22" height={FLOOR_Y - CEIL_Y + 42} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1"/>

          {/* Flow label */}
          <text x={W / 2} y={FLOOR_Y + 50} textAnchor="middle" fontSize="8"
            fontFamily="'Courier New', monospace" fill="hsl(var(--muted-foreground))" opacity="0.4" letterSpacing="3">
            INPUT  ——————————————  PRODUCTIELIJN  ——————————————  OUTPUT
          </text>
        </svg>
      </div>

      {/* Detail panel */}
      <div className={`w-full max-w-[720px] min-h-[110px] mx-auto my-1 p-4 rounded-md border transition-all ${
        af ? 'border-primary/20 bg-card/80' : 'border-border bg-card/30'
      }`}>
        {af ? (
          <>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-sm font-bold tracking-widest" style={{ color: af.color }}>{af.label}</span>
              <span className="text-[9px] text-muted-foreground/50 tracking-wider">{af.sublabel}</span>
              <span onClick={() => setActive(null)} className="ml-auto text-[9px] text-muted-foreground/40 cursor-pointer tracking-wider hover:text-muted-foreground transition-colors">
                SLUIT
              </span>
            </div>
            
            {/* whatHappens — always visible, plain language */}
            <p className="text-xs text-foreground/80 leading-relaxed mb-3">{af.whatHappens}</p>
            
            {/* Technical details — toggle */}
            {!showTechnical ? (
              <button 
                onClick={(e) => { e.stopPropagation(); setShowTechnical(true); }}
                className="text-[10px] text-primary/60 hover:text-primary tracking-wider uppercase cursor-pointer transition-colors"
              >
                ▸ Technisch detail
              </button>
            ) : (
              <div className="space-y-2 animate-in fade-in duration-200">
                <p className="text-[11px] text-muted-foreground leading-relaxed tracking-wide">{af.detail}</p>
                <div className="flex flex-wrap gap-1.5">
                  {af.modules.map(m => (
                    <span key={m} className="px-2.5 py-1 rounded text-[9.5px] font-mono border border-border/50 bg-secondary/30 text-muted-foreground">
                      {m}
                    </span>
                  ))}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowTechnical(false); }}
                  className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground tracking-wider uppercase cursor-pointer transition-colors"
                >
                  ▾ Verberg
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-muted-foreground/30 text-[10px] tracking-widest text-center pt-5">
            KLIK OP EEN STATION VOOR DETAILS
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-1.5 flex-wrap justify-center max-w-[720px] pb-4">
        {STATIONS.map((s, i) => (
          <div key={s.id} onClick={() => setActive(active === i ? null : i)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border cursor-pointer transition-all ${
              active === i ? 'border-primary/40 bg-primary/5' : 'border-border/30 bg-transparent hover:border-border'
            }`}>
            <div className="w-2 h-2 rounded-sm" style={{ background: s.color }}/>
            <span className={`text-[8.5px] tracking-wider ${active === i ? 'text-foreground' : 'text-muted-foreground/40'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

FactoryDiagram.displayName = "FactoryDiagram";

export default FactoryDiagram;
