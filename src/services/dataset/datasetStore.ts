import type { DatasetFile, TrainingSample } from '../../models/dataset';

/**
 * Dataset de entrenamiento guardado en IndexedDB de este navegador (los
 * videos pesan demasiado para localStorage). No hay backend todavía: para
 * reunir lo que graba cada persona del equipo se usa exportar/importar, y el
 * dataset consolidado se publica con la app en `public/datasets/<lengua>.json`
 * (ver docs/ENTRENAMIENTO-IA.md).
 */

const DB_NAME = 'diversena';
const DB_VERSION = 1;
const SAMPLES = 'samples';
const VIDEOS = 'videos';

/** Se emite en `window` cada vez que el dataset cambia, para que el reconocimiento recargue. */
export const DATASET_CHANGED_EVENT = 'diversena:dataset-changed';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB no disponible en este navegador'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(SAMPLES)) {
          db.createObjectStore(SAMPLES, { keyPath: 'id' }).createIndex('languageId', 'languageId');
        }
        if (!db.objectStoreNames.contains(VIDEOS)) {
          db.createObjectStore(VIDEOS, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function notifyChanged(): void {
  window.dispatchEvent(new Event(DATASET_CHANGED_EVENT));
}

export function newSampleId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function addSample(sample: TrainingSample, video: Blob | null): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([SAMPLES, VIDEOS], 'readwrite');
  tx.objectStore(SAMPLES).put({ ...sample, hasVideo: video !== null });
  if (video) tx.objectStore(VIDEOS).put({ id: sample.id, blob: video });
  await transactionDone(tx);
  notifyChanged();
}

export async function listSamples(languageId?: string): Promise<TrainingSample[]> {
  const db = await openDb();
  const store = db.transaction(SAMPLES, 'readonly').objectStore(SAMPLES);
  const request = languageId ? store.index('languageId').getAll(languageId) : store.getAll();
  const samples = (await promisify(request)) as TrainingSample[];
  return samples.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteSample(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([SAMPLES, VIDEOS], 'readwrite');
  tx.objectStore(SAMPLES).delete(id);
  tx.objectStore(VIDEOS).delete(id);
  await transactionDone(tx);
  notifyChanged();
}

export async function getSampleVideo(id: string): Promise<Blob | null> {
  const db = await openDb();
  const record = (await promisify(db.transaction(VIDEOS, 'readonly').objectStore(VIDEOS).get(id))) as
    | { id: string; blob: Blob }
    | undefined;
  return record?.blob ?? null;
}

/** JSON con landmarks y metadatos (sin videos): liviano y sin imagen de nadie. */
export async function exportDataset(languageId: string | null): Promise<string> {
  const samples = await listSamples(languageId ?? undefined);
  const file: DatasetFile = {
    format: 'diversena-dataset',
    version: 1,
    exportedAt: new Date().toISOString(),
    languageId,
    samples: samples.map((sample) => ({ ...sample, hasVideo: false })),
  };
  return JSON.stringify(file);
}

export function parseDatasetFile(json: string): DatasetFile {
  const parsed = JSON.parse(json) as Partial<DatasetFile>;
  if (parsed.format !== 'diversena-dataset' || !Array.isArray(parsed.samples)) {
    throw new Error('El archivo no es un dataset de DiverSeña.');
  }
  return parsed as DatasetFile;
}

/** Agrega las muestras del archivo (las que ya existen con el mismo id se reemplazan). */
export async function importDataset(json: string): Promise<number> {
  const file = parseDatasetFile(json);
  const db = await openDb();
  // Los videos no viajan en el JSON: si este navegador ya tiene el de una
  // muestra (fue grabada aquí), se conserva la marca.
  const videoIds = new Set(
    (await promisify(db.transaction(VIDEOS, 'readonly').objectStore(VIDEOS).getAllKeys())).map(String),
  );
  const tx = db.transaction(SAMPLES, 'readwrite');
  const store = tx.objectStore(SAMPLES);
  for (const sample of file.samples) {
    store.put({ ...sample, hasVideo: videoIds.has(sample.id) });
  }
  await transactionDone(tx);
  notifyChanged();
  return file.samples.length;
}
