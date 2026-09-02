export type VowelLetter = 'A' | 'E' | 'I' | 'O' | 'U';

/**
 * Referencia geométrica (ángulos/distancias normalizadas) que usará el
 * clasificador para una seña concreta. Aún no existen datos reales: el
 * equipo los entregará por lengua más adelante (ver README, sección
 * "Reconocimiento").
 */
export interface SignClassificationData {
  status: 'pending';
}

export interface Sign {
  id: string;
  letter: VowelLetter;
  languageId: string;
  name: string;
  image: string | null;
  video: string | null;
  description: string | null;
  instructions: string | null;
  classificationData: SignClassificationData | null;
}

export interface Language {
  id: string;
  name: string;
  country: string;
  signs: Sign[];
}
