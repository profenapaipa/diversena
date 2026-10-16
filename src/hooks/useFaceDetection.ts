import { useEffect, useState, type RefObject } from 'react';
import { getFaceDetector } from '../services/mediapipe/faceDetectionService';

export type FaceDetectionStatus = 'inactivo' | 'cargando' | 'sin-rostro' | 'un-rostro' | 'varios-rostros' | 'error';

/** Caja del rostro en coordenadas normalizadas (0-1) del cuadro sin espejar. */
export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UseFaceDetectionResult {
  status: FaceDetectionStatus;
  faces: FaceBox[];
}

/**
 * Para encuadrar una foto basta con ~8 lecturas por segundo; así la
 * detección de rostro no le resta fluidez a la de manos si ambas corren.
 */
const DETECTION_INTERVAL_MS = 120;

/**
 * Detección (no reconocimiento) de rostros: dónde hay una cara en el cuadro.
 * Se usa para encuadrar la foto de perfil; no identifica a nadie.
 */
export function useFaceDetection(
  videoRef: RefObject<HTMLVideoElement | null>,
  active: boolean,
): UseFaceDetectionResult {
  const [status, setStatus] = useState<FaceDetectionStatus>('cargando');
  const [faces, setFaces] = useState<FaceBox[]>([]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let timer = 0;
    let lastTimestamp = 0;
    setStatus('cargando');

    getFaceDetector()
      .then((detector) => {
        if (cancelled) return;
        const tick = () => {
          if (cancelled) return;
          const video = videoRef.current;
          if (video && video.readyState >= 2 && video.videoWidth > 0) {
            const now = Math.max(performance.now(), lastTimestamp + 1);
            lastTimestamp = now;
            const { detections } = detector.detectForVideo(video, now);
            const boxes = detections
              .map((detection) => detection.boundingBox)
              .filter((box) => box !== undefined)
              .map((box) => ({
                x: box.originX / video.videoWidth,
                y: box.originY / video.videoHeight,
                width: box.width / video.videoWidth,
                height: box.height / video.videoHeight,
              }));
            setFaces(boxes);
            setStatus(boxes.length === 0 ? 'sin-rostro' : boxes.length === 1 ? 'un-rostro' : 'varios-rostros');
          }
          timer = window.setTimeout(tick, DETECTION_INTERVAL_MS);
        };
        tick();
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [active, videoRef]);

  if (!active) return { status: 'inactivo', faces: [] };
  return { status, faces };
}

/**
 * Recorta el rostro (con margen, en cuadrado) del cuadro actual del video y
 * lo devuelve como JPEG pequeño, en espejo para que coincida con lo que la
 * persona veía en pantalla.
 */
export function captureFaceAvatar(video: HTMLVideoElement, face: FaceBox, size = 192): string | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;

  const centerX = (face.x + face.width / 2) * vw;
  const centerY = (face.y + face.height / 2) * vh;
  // 1.8× la cara: entra cabello y mentón, como una foto de perfil normal.
  const side = Math.min(Math.max(face.width * vw, face.height * vh) * 1.8, vw, vh);
  const sx = Math.min(Math.max(centerX - side / 2, 0), vw - side);
  const sy = Math.min(Math.max(centerY - side / 2, 0), vh - side);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.translate(size, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, sx, sy, side, side, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.85);
}
