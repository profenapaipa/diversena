const PREFERRED_TYPES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return undefined;
  return PREFERRED_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

/** Graba exactamente `seconds` segundos del stream y entrega el video. */
export function recordClip(stream: MediaStream, seconds: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mimeType = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch (err) {
      reject(err instanceof Error ? err : new Error('No se pudo iniciar la grabación.'));
      return;
    }
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }));
    recorder.onerror = () => reject(new Error('La grabación falló.'));
    recorder.start();
    window.setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop();
    }, seconds * 1000);
  });
}

export function videoExtension(blob: Blob): string {
  return blob.type.includes('mp4') ? 'mp4' : 'webm';
}
