import type { DominantHand } from '../../models/dataset';

export type ProfileRole = 'estudiante' | 'docente' | 'familia' | 'otro';

export interface SignProgress {
  /** Veces que la seña se reconoció de forma estable mientras se practicaba. */
  successes: number;
  lastPracticedAt: string;
}

export interface UserProfile {
  name: string;
  role: ProfileRole;
  dominantHand: DominantHand;
  /**
   * Foto de perfil (recorte del rostro, JPEG pequeño en data URL). Es solo un
   * avatar: no se calcula ni guarda ninguna huella facial, y nunca sale del
   * navegador.
   */
  avatar: string | null;
  createdAt: string;
  /** Progreso por seña, con clave "<lengua>:<seña>". */
  progress: Record<string, SignProgress>;
}

const STORAGE_KEY = 'diversena.profile.v1';
const listeners = new Set<() => void>();
let cached: UserProfile | null | undefined;

function read(): UserProfile | null {
  if (cached !== undefined) return cached;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cached = raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    cached = null;
  }
  return cached;
}

function write(profile: UserProfile | null): void {
  cached = profile;
  try {
    if (profile) localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Almacenamiento bloqueado: el perfil dura lo que dure la pestaña.
  }
  listeners.forEach((listener) => listener());
}

export function getProfile(): UserProfile | null {
  return read();
}

export function subscribeProfile(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function saveProfile(data: Pick<UserProfile, 'name' | 'role' | 'dominantHand' | 'avatar'>): void {
  const current = read();
  write({
    progress: {},
    createdAt: new Date().toISOString(),
    ...current,
    ...data,
  });
}

export function deleteProfile(): void {
  write(null);
}

/** Registra un acierto de práctica. Sin perfil creado no se guarda nada. */
export function recordPracticeSuccess(languageId: string, signId: string): void {
  const current = read();
  if (!current) return;
  const key = `${languageId}:${signId}`;
  const previous = current.progress[key];
  write({
    ...current,
    progress: {
      ...current.progress,
      [key]: {
        successes: (previous?.successes ?? 0) + 1,
        lastPracticedAt: new Date().toISOString(),
      },
    },
  });
}
