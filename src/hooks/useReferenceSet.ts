import { useEffect, useState } from 'react';
import type { Language } from '../models/language';
import { DATASET_CHANGED_EVENT } from '../services/dataset/datasetStore';
import { loadReferenceSet, type LoadedReferenceSet } from '../services/recognition/referenceSet';
import { REFERENCES_CHANGED_EVENT } from '../services/recognition/referenceStore';

const EMPTY: LoadedReferenceSet = { references: {}, sampleCount: 0 };

/**
 * Referencias de reconocimiento de una lengua. Se recargan solas cuando
 * alguien graba, importa o borra datos de entrenamiento en esta misma
 * sesión: lo que se entrena se nota de inmediato al practicar.
 */
export function useReferenceSet(language: Language | undefined): {
  loaded: LoadedReferenceSet;
  loading: boolean;
} {
  const [loaded, setLoaded] = useState<LoadedReferenceSet>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!language) return;
    let cancelled = false;

    const reload = () => {
      setLoading(true);
      loadReferenceSet(language)
        .then((result) => {
          if (!cancelled) setLoaded(result);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    reload();
    window.addEventListener(DATASET_CHANGED_EVENT, reload);
    window.addEventListener(REFERENCES_CHANGED_EVENT, reload);
    return () => {
      cancelled = true;
      window.removeEventListener(DATASET_CHANGED_EVENT, reload);
      window.removeEventListener(REFERENCES_CHANGED_EVENT, reload);
    };
  }, [language]);

  return { loaded: language ? loaded : EMPTY, loading };
}
