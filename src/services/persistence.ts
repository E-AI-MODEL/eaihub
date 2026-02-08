// Hybrid Persistence Layer - localStorage only until database tables are created
// This avoids TypeScript errors from undefined Supabase tables

export type RunRow = {
  id?: string;
  actor_type: string;
  actor_id: string;
  impact: "formatief" | "summatief" | "beleid";
  workflow_id: string;
  ssot_version: string;
  status: "created" | "running" | "waiting_human" | "completed" | "failed";
  input_ref?: string | null;
  notes?: string | null;
  created_at?: string;
};

export type ArtefactRow = {
  id?: string;
  run_id: string;
  kind?: string;
  provider?: string | null;
  model?: string | null;
  content: string;
  created_at?: string;
};

export type AuditRow = {
  id?: string;
  event_type: string;
  run_id?: string | null;
  payload?: unknown;
  created_at?: string;
};

const LS_RUNS = "eai:runs:v1";
const LS_ARTEFACTS = "eai:artefacts:v1";
const LS_AUDIT = "eai:audit:v1";

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function lsSet<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable
  }
}

function uuidLike(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function nowISO(): string {
  return new Date().toISOString();
}

// For now, always use localStorage - Supabase tables will be added later
export function persistenceMode(): "local" | "supabase" {
  return "local";
}

export async function saveRun(run: RunRow) {
  const runs = lsGet<RunRow[]>(LS_RUNS, []);
  const row: RunRow = { 
    ...run, 
    id: run.id ?? uuidLike(),
    created_at: run.created_at ?? nowISO()
  };
  runs.unshift(row);
  lsSet(LS_RUNS, runs);
  return { ok: true as const, mode: "local" as const, data: row };
}

export async function listRuns() {
  const runs = lsGet<RunRow[]>(LS_RUNS, []);
  return { ok: true as const, mode: "local" as const, data: runs };
}

export async function saveArtefact(a: ArtefactRow) {
  const artefacts = lsGet<ArtefactRow[]>(LS_ARTEFACTS, []);
  const row: ArtefactRow = { 
    ...a, 
    id: a.id ?? uuidLike(),
    created_at: a.created_at ?? nowISO()
  };
  artefacts.unshift(row);
  lsSet(LS_ARTEFACTS, artefacts);
  return { ok: true as const, mode: "local" as const, data: row };
}

export async function listArtefacts(run_id?: string) {
  const artefacts = lsGet<ArtefactRow[]>(LS_ARTEFACTS, []);
  const filtered = run_id ? artefacts.filter(a => a.run_id === run_id) : artefacts;
  return { ok: true as const, mode: "local" as const, data: filtered };
}

export async function logAudit(e: AuditRow) {
  const audit = lsGet<AuditRow[]>(LS_AUDIT, []);
  audit.unshift({ 
    ...e, 
    id: e.id ?? uuidLike(),
    created_at: e.created_at ?? nowISO()
  });
  lsSet(LS_AUDIT, audit);
  return { ok: true as const, mode: "local" as const };
}

export async function listAudit(limit = 200) {
  const audit = lsGet<AuditRow[]>(LS_AUDIT, []);
  return { ok: true as const, mode: "local" as const, data: audit.slice(0, limit) };
}

export async function getRun(id: string) {
  const runs = lsGet<RunRow[]>(LS_RUNS, []);
  const found = runs.find(r => r.id === id) || null;
  return { ok: true as const, mode: "local" as const, data: found };
}

export async function updateRun(id: string, patch: Partial<RunRow>) {
  const runs = lsGet<RunRow[]>(LS_RUNS, []);
  const idx = runs.findIndex(r => r.id === id);
  if (idx === -1) return { ok: false as const, mode: "local" as const, data: null };
  runs[idx] = { ...runs[idx], ...patch, id };
  lsSet(LS_RUNS, runs);
  return { ok: true as const, mode: "local" as const, data: runs[idx] };
}

export async function clearAllLocalData() {
  localStorage.removeItem(LS_RUNS);
  localStorage.removeItem(LS_ARTEFACTS);
  localStorage.removeItem(LS_AUDIT);
  return { ok: true as const };
}
