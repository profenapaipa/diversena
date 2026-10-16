import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { TrainingSample } from '../../models/dataset';
import type { HandFeatureVector } from '../../models/handFeatures';
import type { Language } from '../../models/language';
import { listSamples, parseDatasetFile } from '../dataset/datasetStore';
import { extractHandFeatures, normalizeHandLandmarks } from './landmarkProcessor';
import { getReferencesForLanguage } from './referenceStore';

/** Referencias por seña (signId → vectores de características). */
export type ReferenceSet = Record<string, HandFeatureVector[]>;

/** Máximo de cuadros que aporta cada clip: más no mejora y solo hace lento el k-NN. */
const MAX_FRAMES_PER_SAMPLE = 12;
/**
 * Solo se usa la parte central del clip: al inicio y al final la mano está
 * entrando o saliendo de la seña (transición), no en la configuración final.
 */
const CORE_START = 0.2;
const CORE_END = 0.8;
/** Clips donde casi nunca se vio la mano no aportan referencias confiables. */
export const MIN_HAND_COVERAGE = 0.5;

/** Convierte un clip de entrenamiento en varias referencias geométricas (una por cuadro útil). */
export function featuresFromSample(sample: TrainingSample): HandFeatureVector[] {
  if (sample.handCoverage < MIN_HAND_COVERAGE || sample.frames.length === 0) return [];
  const from = Math.floor(sample.frames.length * CORE_START);
  const to = Math.max(from + 1, Math.ceil(sample.frames.length * CORE_END));
  const core = sample.frames.slice(from, to).filter((frame) => frame.hands.length > 0);
  if (core.length === 0) return [];

  const step = Math.max(1, core.length / MAX_FRAMES_PER_SAMPLE);
  const picked = [];
  for (let i = 0; i < core.length && picked.length < MAX_FRAMES_PER_SAMPLE; i += step) {
    picked.push(core[Math.floor(i)]);
  }
  return picked.map((frame) =>
    extractHandFeatures(normalizeHandLandmarks(frame.hands[0] as NormalizedLandmark[])),
  );
}

const bundledCache = new Map<string, Promise<TrainingSample[]>>();

/**
 * Dataset consolidado que viaja con la app (`public/datasets/<lengua>.json`):
 * así cualquier estudiante tiene reconocimiento sin capturar nada.
 */
function loadBundledSamples(languageId: string): Promise<TrainingSample[]> {
  let promise = bundledCache.get(languageId);
  if (!promise) {
    promise = fetch(`${import.meta.env.BASE_URL}datasets/${languageId}.json`)
      .then((response) => (response.ok ? response.text() : null))
      .then((text) => (text ? parseDatasetFile(text).samples : []))
      .catch(() => []);
    bundledCache.set(languageId, promise);
  }
  return promise;
}

export interface LoadedReferenceSet {
  references: ReferenceSet;
  /** Clips de entrenamiento que aportaron referencias (publicados + de este navegador). */
  sampleCount: number;
}

/**
 * Une las tres fuentes de referencias de una lengua:
 *  1. el dataset publicado con la app,
 *  2. el dataset grabado/importado en este navegador (IndexedDB),
 *  3. las referencias de una sola postura de la herramienta anterior.
 */
export async function loadReferenceSet(language: Language): Promise<LoadedReferenceSet> {
  const references: ReferenceSet = {};
  const add = (signId: string, vectors: HandFeatureVector[]) => {
    if (vectors.length === 0) return;
    (references[signId] ??= []).push(...vectors);
  };

  const [bundled, local] = await Promise.all([
    loadBundledSamples(language.id),
    listSamples(language.id).catch(() => [] as TrainingSample[]),
  ]);

  // Una muestra importada puede estar también en el publicado: no contarla dos veces.
  const seen = new Set<string>();
  let sampleCount = 0;
  for (const sample of [...bundled, ...local]) {
    if (seen.has(sample.id) || sample.languageId !== language.id) continue;
    seen.add(sample.id);
    const vectors = featuresFromSample(sample);
    if (vectors.length > 0) sampleCount++;
    add(sample.signId, vectors);
  }

  for (const [signId, vector] of Object.entries(getReferencesForLanguage(language.id))) {
    add(signId, [vector]);
  }

  return { references, sampleCount };
}
