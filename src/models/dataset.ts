/**
 * Dataset de entrenamiento: clips cortos de una persona haciendo una seña,
 * etiquetados con lengua + seña. Se guarda la SECUENCIA de landmarks (no
 * características ya calculadas): así, si mañana cambia el extractor de
 * características o se entrena una red neuronal, los mismos datos sirven sin
 * volver a grabar a nadie.
 */

export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}

export interface SampleFrame {
  /** Segundos desde el inicio del clip. */
  t: number;
  /** Una entrada por mano detectada en este cuadro (0, 1 o 2). */
  hands: LandmarkPoint[][];
  /** "Left"/"Right" según MediaPipe para cada mano de `hands` (imagen sin espejar). */
  handedness: string[];
}

export type DominantHand = 'derecha' | 'izquierda';

/**
 * Quién hace la seña. Importa para la calidad del modelo: las referencias de
 * personas Sordas usuarias de la lengua y de intérpretes certificados pesan
 * más que las de aprendices.
 */
export type SignerProfile = 'sorda' | 'interprete' | 'oyente-fluido' | 'aprendiz';

export interface ContributorInfo {
  /** Seudónimo, nunca nombre completo ni documento: el dataset se comparte. */
  alias: string;
  dominantHand: DominantHand;
  signerProfile: SignerProfile;
}

export interface TrainingSample {
  id: string;
  version: 1;
  languageId: string;
  signId: string;
  /** Etiqueta legible (p. ej. "A"), redundante con signId para leer el JSON a mano. */
  label: string;
  source: 'camara' | 'archivo';
  originalFileName: string | null;
  contributor: ContributorInfo;
  /** Momento en que la persona aceptó el consentimiento de uso de sus datos. */
  consentAt: string;
  createdAt: string;
  durationSec: number;
  /** Cuadros por segundo con los que se muestreó el video al extraer landmarks. */
  sampleFps: number;
  /** Fracción (0-1) de cuadros en los que se detectó al menos una mano. */
  handCoverage: number;
  /** Si el video original sigue guardado en este navegador (no viaja en el JSON exportado). */
  hasVideo: boolean;
  frames: SampleFrame[];
}

export interface DatasetFile {
  format: 'diversena-dataset';
  version: 1;
  exportedAt: string;
  languageId: string | null;
  samples: TrainingSample[];
}
