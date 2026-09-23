export type FingerName = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';

/**
 * Descripción geométrica de una postura de mano, ya normalizada (ver
 * `services/recognition/landmarkProcessor.ts`): no depende del tamaño de la
 * mano, la distancia a la cámara ni su orientación en el plano de la imagen.
 */
export interface HandFeatureVector {
  /** Ángulo de flexión en la articulación media de cada dedo, en grados. */
  fingerCurl: Record<FingerName, number>;
  /** Distancia (normalizada) de cada punta de dedo a la muñeca. */
  fingertipDistance: Record<FingerName, number>;
}
