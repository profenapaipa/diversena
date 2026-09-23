import type { HandFeatureVector } from '../../models/handFeatures';

const STORAGE_KEY = 'diversena.signReferences.v1';

type ReferenceMap = Record<string, HandFeatureVector>;

function referenceKey(languageId: string, signId: string): string {
  return `${languageId}:${signId}`;
}

/**
 * Referencias reales capturadas por el equipo (alguien que sabe la lengua
 * hace la seña frente a la cámara). Viven solo en localStorage de este
 * navegador — no hay backend ni base de datos todavía (sección 26/32) — por
 * eso existen `exportReferences`/`importReferences`: para que una persona
 * capture y las demás las reciban como archivo, sin inventar ningún dato.
 */
function readAll(): ReferenceMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReferenceMap) : {};
  } catch {
    return {};
  }
}

function writeAll(map: ReferenceMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Almacenamiento no disponible (privado/bloqueado): la sesión sigue
    // funcionando, solo no persiste la referencia entre recargas.
  }
}

export function getReference(languageId: string, signId: string): HandFeatureVector | null {
  return readAll()[referenceKey(languageId, signId)] ?? null;
}

export function saveReference(languageId: string, signId: string, features: HandFeatureVector): void {
  const all = readAll();
  all[referenceKey(languageId, signId)] = features;
  writeAll(all);
}

export function clearReference(languageId: string, signId: string): void {
  const all = readAll();
  delete all[referenceKey(languageId, signId)];
  writeAll(all);
}

export function getReferencesForLanguage(languageId: string): Record<string, HandFeatureVector> {
  const prefix = `${languageId}:`;
  const result: Record<string, HandFeatureVector> = {};
  for (const [key, value] of Object.entries(readAll())) {
    if (key.startsWith(prefix)) {
      result[key.slice(prefix.length)] = value;
    }
  }
  return result;
}

export function exportReferences(): string {
  return JSON.stringify(readAll(), null, 2);
}

export function importReferences(json: string): void {
  const parsed = JSON.parse(json) as ReferenceMap;
  writeAll({ ...readAll(), ...parsed });
}
