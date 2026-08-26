import type { Sign, VowelLetter } from '../../models/language';

export const VOWELS: readonly VowelLetter[] = ['A', 'E', 'I', 'O', 'U'];

/**
 * Genera las 5 vocales de una lengua con recursos aún no entregados por el
 * equipo. No se inventa información lingüística: todo queda marcado como
 * pendiente hasta recibir imágenes, videos, explicaciones y referencias de
 * clasificación reales.
 */
export function buildPlaceholderSigns(languageId: string): Sign[] {
  return VOWELS.map((letter) => ({
    id: `${languageId}-${letter.toLowerCase()}`,
    letter,
    languageId,
    name: `Vocal ${letter}`,
    image: null,
    video: null,
    description: null,
    instructions: null,
    classificationData: null,
  }));
}
