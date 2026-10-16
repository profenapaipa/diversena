import { useEffect, useMemo, useRef, useState } from 'react';
import type { HandFeatureVector } from '../models/handFeatures';
import type { Sign } from '../models/language';
import { classifyWithReferenceSet, type SignMatch } from '../services/recognition/signClassifier';
import { TemporalVoter } from '../services/recognition/temporalVoter';

/**
 * Clasifica cada lectura de la mano y la pasa por una votación temporal:
 * el resultado mostrado solo cambia cuando la misma seña gana varias
 * lecturas seguidas (~0.5 s), en vez de saltar con cada cuadro.
 */
export function useStableClassification(
  features: HandFeatureVector | null,
  candidates: Array<{ sign: Sign; references: HandFeatureVector[] }>,
): SignMatch<Sign> | null {
  const voterRef = useRef(new TemporalVoter<string>(8, 5));
  const [stable, setStable] = useState<SignMatch<Sign> | null>(null);

  const raw = useMemo(
    () => (features && candidates.length > 0 ? classifyWithReferenceSet(features, candidates) : null),
    [features, candidates],
  );

  const candidatesRef = useRef(candidates);

  useEffect(() => {
    // Cambiar de lengua o de referencias empieza una votación nueva.
    if (candidatesRef.current !== candidates) {
      candidatesRef.current = candidates;
      voterRef.current.reset();
    }
    const winnerId = voterRef.current.push(raw?.sign.id ?? null);
    setStable((previous) => {
      if (winnerId === null) return previous === null ? previous : null;
      if (raw && raw.sign.id === winnerId) return raw;
      // La lectura actual difiere de la ganadora: mantener la ganadora previa.
      return previous?.sign.id === winnerId ? previous : null;
    });
  }, [raw, candidates]);

  return stable;
}
