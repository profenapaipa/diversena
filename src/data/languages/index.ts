import type { Language } from '../../models/language';
import { colombia } from './colombia';
import { mexico } from './mexico';
import { ecuador } from './ecuador';

export const languages: Language[] = [colombia, mexico, ecuador];

export function getLanguageById(id: string): Language | undefined {
  return languages.find((language) => language.id === id);
}

/** Lengua con la que arrancan las pantallas: hoy el foco del proyecto es la LSC. */
export const DEFAULT_LANGUAGE_ID = 'lsc';

export function isLanguageAvailable(language: Language): boolean {
  return language.status === 'disponible';
}
