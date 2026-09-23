import { useMemo } from 'react';
import type { HandFeatureVector } from '../models/handFeatures';
import { extractHandFeatures, normalizeHandLandmarks } from '../services/recognition/landmarkProcessor';
import { useCamera, type UseCameraResult } from './useCamera';
import { useHandLandmarker, type UseHandLandmarkerResult } from './useHandLandmarker';

export interface UseTrackedHandResult {
  camera: UseCameraResult;
  tracking: UseHandLandmarkerResult;
  /** Características geométricas de la primera mano detectada, o null si no hay ninguna. */
  features: HandFeatureVector | null;
}

/**
 * Combina cámara + detección de manos + normalización/extracción de
 * características (Fases 4-6) en un solo punto, para no repetir ese cableado
 * en cada lugar que necesite "la mano trackeada ahora mismo" (vista en vivo,
 * captura de referencias).
 */
export function useTrackedHand(): UseTrackedHandResult {
  const camera = useCamera();
  const tracking = useHandLandmarker(camera.videoRef, camera.status === 'active');
  const firstHand = tracking.hands[0];

  const features = useMemo(() => {
    if (!firstHand) return null;
    return extractHandFeatures(normalizeHandLandmarks(firstHand));
  }, [firstHand]);

  return { camera, tracking, features };
}
