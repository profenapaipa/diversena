/** Recuerda si esta persona ya vio la introducción en pantallas. */
const STORAGE_KEY = 'diversena.intro.v1';

/** ¿Ya vio esta persona la introducción? (con el almacenamiento bloqueado se muestra una sola vez por pestaña) */
let seenInTab = false;
export function hasSeenIntro(): boolean {
  if (seenInTab) return true;
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}
export function markIntroSeen() {
  seenInTab = true;
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Sin almacenamiento: no se recuerda, solo dura la pestaña.
  }
}

