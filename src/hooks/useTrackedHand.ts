import { useMemo } from 'react';
import type { HandFeatureVector } from '../models/handFeatures';
import { extractHandFeatures, normalizeHandLandmarks } from '../services/recognition/landmarkProcessor';
import { DEFAULT_ASPECT, describePose3d, extendedFingers } from '../services/recognition/handPose3d';
import { currentZScale } from '../services/recognition/calibration';
import { useCalibration } from './useCalibration';
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
  const calibration = useCalibration();

  // Las vocales se hacen con una mano: si se ven las dos, se reconoce la
  // dominante (según el perfil; derecha si no hay perfil).
  const recognizedHand =
    tracking.hands.find((hand) => hand.side === dominantHand) ?? tracking.hands[0] ?? null;

  const features = useMemo(() => {
    if (!recognizedHand) return null;
    const video = camera.videoRef.current;
    const aspect = video && video.videoWidth > 0 && video.videoHeight > 0 ? video.videoWidth / video.videoHeight : DEFAULT_ASPECT;
    return {
      ...extractHandFeatures(normalizeHandLandmarks(recognizedHand.landmarks)),
      pose3d: describePose3d(recognizedHand.landmarks, aspect, recognizedHand.side, currentZScale(), calibration?.ratios),
      extended: extendedFingers(recognizedHand.landmarks),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- el video se lee al calcular; cambia la lectura, no la referencia
  }, [recognizedHand, calibration]);

  return { camera, tracking, recognizedHand, features };
}
