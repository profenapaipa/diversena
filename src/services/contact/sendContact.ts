import { CONTACT_ENDPOINT, CONTACT_LIMITS, CONTACT_REASONS, type ContactReasonId } from '../../data/contact';

export interface ContactMessage {
  reason: ContactReasonId;
  name: string;
  /** Correo o teléfono para responder. */
  contact: string;
  message: string;
  /** Campo trampa: las personas no lo ven ni lo llenan; si trae algo, es un robot. */
  honey?: string;
}

export type ContactResult =
  | { ok: true; needsActivation: boolean }
  | { ok: false; reason: 'invalid' | 'network' | 'rejected'; detail?: string };

/** ¿Parece un correo o un teléfono? No se valida de más: basta con poder responderle a alguien. */
export function looksLikeContact(value: string): boolean {
  const v = value.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return true;
  return v.replace(/[^\d]/g, '').length >= 7;
}

export function validateContact(m: ContactMessage): string | null {
  if (m.name.trim().length < 2) return 'Escribe tu nombre.';
  if (!looksLikeContact(m.contact)) return 'Escribe un correo o un teléfono para poder responderte.';
  if (m.message.trim().length < 10) return 'Cuéntanos un poco más en el mensaje.';
  if (m.message.length > CONTACT_LIMITS.message) return `El mensaje puede tener hasta ${CONTACT_LIMITS.message} caracteres.`;
  return null;
}

/**
 * Envía el mensaje por correo con FormSubmit. Devuelve el resultado sin lanzar errores: la pantalla decide qué decir.
 * `fetchImpl` permite probarlo sin red.
 */
export async function sendContact(m: ContactMessage, fetchImpl: typeof fetch = fetch): Promise<ContactResult> {
  if (m.honey) return { ok: true, needsActivation: false }; // un robot cree que funcionó y no llega nada
  if (validateContact(m)) return { ok: false, reason: 'invalid' };

  const reasonLabel = CONTACT_REASONS.find((r) => r.id === m.reason)?.label ?? 'Otro tema';
  const body = {
    _subject: `DiverSeña: ${reasonLabel}`,
    _template: 'table',
    _captcha: 'false',
    Motivo: reasonLabel,
    Nombre: m.name.trim().slice(0, CONTACT_LIMITS.name),
    'Correo o teléfono': m.contact.trim().slice(0, CONTACT_LIMITS.contact),
    Mensaje: m.message.trim(),
    // Si la persona dejó un correo, la respuesta del buzón va directo a ella.
    ...(m.contact.includes('@') ? { _replyto: m.contact.trim() } : {}),
  };

  try {
    const response = await fetchImpl(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as { success?: string | boolean; message?: string };
    const success = data.success === true || data.success === 'true';
    if (!response.ok || !success) return { ok: false, reason: 'rejected', detail: data.message };
    // La primera vez, FormSubmit pide activar el formulario desde el correo que recibe; el mensaje queda en espera.
    return { ok: true, needsActivation: /activat/i.test(data.message ?? '') };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
