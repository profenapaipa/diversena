import type { SignerProfile, TrainingSample } from '../../models/dataset';
import { MIN_HAND_COVERAGE } from '../recognition/referenceSet';

/** Metas por seña para una primera versión confiable (ver docs/ENTRENAMIENTO-IA.md). */
export const TARGET_CLIPS_PER_SIGN = 40;
export const TARGET_PEOPLE_PER_SIGN = 8;

export type SignReadiness = 'sin-datos' | 'iniciando' | 'en-camino' | 'lista';

export interface SignDatasetStats {
  clips: number;
  people: number;
  readiness: SignReadiness;
}

export function readinessOf(clips: number, people: number): SignReadiness {
  if (clips === 0) return 'sin-datos';
  if (clips >= TARGET_CLIPS_PER_SIGN && people >= TARGET_PEOPLE_PER_SIGN) return 'lista';
  if (clips >= TARGET_CLIPS_PER_SIGN / 4) return 'en-camino';
  return 'iniciando';
}

/** Solo cuentan los clips útiles (con la mano visible), igual que el reconocimiento. */
export function statsBySign(samples: TrainingSample[]): Record<string, SignDatasetStats> {
  const grouped = new Map<string, TrainingSample[]>();
  for (const sample of samples) {
    if (sample.handCoverage < MIN_HAND_COVERAGE) continue;
    grouped.set(sample.signId, [...(grouped.get(sample.signId) ?? []), sample]);
  }
  const result: Record<string, SignDatasetStats> = {};
  for (const [signId, list] of grouped) {
    const people = new Set(list.map((s) => s.contributor.alias.trim().toLowerCase())).size;
    result[signId] = { clips: list.length, people, readiness: readinessOf(list.length, people) };
  }
  return result;
}

export function countBySignerProfile(samples: TrainingSample[]): Record<SignerProfile, number> {
  const counts: Record<SignerProfile, number> = { sorda: 0, interprete: 0, 'oyente-fluido': 0, aprendiz: 0 };
  for (const sample of samples) counts[sample.contributor.signerProfile]++;
  return counts;
}
