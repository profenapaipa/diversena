import { FaceDetector } from '@mediapipe/tasks-vision';
import { createWithGpuFallback, getVisionFileset, localModelUrl, tryUrls, warmUp } from './visionRuntime';

// BlazeFace de corto alcance: detecta rostros a menos de ~2 m (el caso de
// alguien frente a su computador o celular). Es un detector, NO un
// reconocedor: dice dónde hay una cara, nunca de quién es.
const MODEL_URLS = [
  localModelUrl('blaze_face_short_range.tflite'),
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
];

let detectorPromise: Promise<FaceDetector> | null = null;

export function getFaceDetector(): Promise<FaceDetector> {
  if (!detectorPromise) {
    detectorPromise = getVisionFileset()
      .then((fileset) =>
        tryUrls(MODEL_URLS, (modelUrl) =>
          createWithGpuFallback((delegate) =>
            FaceDetector.createFromOptions(fileset, {
              baseOptions: { modelAssetPath: modelUrl, delegate },
              runningMode: 'VIDEO',
              minDetectionConfidence: 0.6,
            }),
          ),
        ),
      )
      .then((detector) => {
        warmUp(detector);
        return detector;
      })
      .catch((err: unknown) => {
        detectorPromise = null;
        throw err;
      });
  }
  return detectorPromise;
}
