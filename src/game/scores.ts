export type ScoreEntry = {
  name: string;
  score: number;
  wave: number;
  at: number;
};

const KEY = "banana-quadrant-scores-v1";
const SET_KEY = "banana-quadrant-settings-v1";
const MAX = 8;

export type Settings = {
  mute: boolean;
  shake: boolean;
};

export function loadScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as { version?: number; scores?: ScoreEntry[] };
    if (!data || !Array.isArray(data.scores)) return [];
    return data.scores
      .filter(
        (e) =>
          e &&
          typeof e.name === "string" &&
          typeof e.score === "number" &&
          typeof e.wave === "number",
      )
      .slice(0, MAX);
  } catch {
    return [];
  }
}

export function bestScore(entries: ScoreEntry[]): number {
  return entries.reduce((m, e) => Math.max(m, e.score), 0);
}

export function qualifies(score: number, entries: ScoreEntry[]): boolean {
  if (score <= 0) return false;
  if (entries.length < MAX) return true;
  return score > entries[entries.length - 1]!.score;
}

export function submitScore(name: string, score: number, wave: number): ScoreEntry[] {
  const clean = (name || "ACE").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) || "ACE";
  const next = loadScores();
  next.push({ name: clean, score, wave, at: Date.now() });
  next.sort((a, b) => b.score - a.score || a.at - b.at);
  const trimmed = next.slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify({ version: 1, scores: trimmed }));
  return trimmed;
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SET_KEY);
    if (!raw) return { mute: false, shake: true };
    const data = JSON.parse(raw) as Partial<Settings>;
    return {
      mute: Boolean(data.mute),
      shake: data.shake !== false,
    };
  } catch {
    return { mute: false, shake: true };
  }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(SET_KEY, JSON.stringify(s));
}
