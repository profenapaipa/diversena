import { useMemo } from 'react';
import type { HandFeatureVector } from '../models/handFeatures';
import { extractHandFeatures, normalizeHandLandmarks } from '../services/recognition/landmarkProcessor';
import { useCamera, type UseCameraResult } from './useCamera';
import { useHandLandmarker, type TrackedHand, type UseHandLandmarkerResult } from './useHandLandmarker';
import { useProfile } from './useProfile';

export interface UseTrackedHandResult {
  camera: UseCameraResult;
  tracking: UseHandLandmarkerResult;
  /** Mano que se está reconociendo (la dominante si están las dos), o null si no hay ninguna. */
  recognizedHand: TrackedHand | null;
  /** Características geométricas de `recognizedHand`, o null si no hay ninguna mano. */
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
  const dominantHand = useProfile()?.dominantHand ?? 'derecha';

  // Las vocales se hacen con una mano: si se ven las dos, se reconoce la
  // dominante (según el perfil; derecha si no hay perfil).
  const recognizedHand =
    tracking.hands.find((hand) => hand.side === dominantHand) ?? tracking.hands[0] ?? null;

  const features = useMemo(() => {
    if (!recognizedHand) return null;
    return extractHandFeatures(normalizeHandLandmarks(recognizedHand.landmarks));
  }, [recognizedHand]);

  return { camera, tracking, recognizedHand, features };
}
