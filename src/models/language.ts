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

/**
 * `disponible`: se puede aprender, practicar e identificar.
 * `proximamente`: visible pero bloqueada para estudiantes hasta que tenga
 * contenido educativo y datos de entrenamiento propios (hoy el foco es LSC).
 */
export type LanguageStatus = 'disponible' | 'proximamente';

export interface Language {
  id: string;
  name: string;
  /** Sigla habitual de la lengua (LSC, LSM, LSEC). */
  shortName: string;
  country: string;
  status: LanguageStatus;
  signs: Sign[];
}
