/**
 * Contacto del semillero. El formulario envía el mensaje por correo con FormSubmit (formsubmit.co), un servicio gratuito
 * que no necesita servidor propio: recibe el envío desde el navegador y lo reenvía a este correo.
 *
 * La primera vez que alguien envíe un mensaje, FormSubmit manda un correo de activación a CONTACT_EMAIL con un enlace;
 * hay que abrirlo una sola vez. Después de activar, FormSubmit entrega un código aleatorio para usarlo en lugar del correo
 * en la dirección y así no dejarlo a la vista en el código (ver docs/CONTACTO.md).
 */
export const CONTACT_EMAIL = 'profenapaipa@gmail.com';

/** Dirección que recibe los envíos. Si hay un código aleatorio de FormSubmit, va aquí en lugar del correo. */
export const CONTACT_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;

/** Motivos de contacto: lo que la persona elige y lo que llega en el asunto del correo. */
export const CONTACT_REASONS = [
  { id: 'participar', label: 'Quiero participar' },
  { id: 'informacion', label: 'Quiero más información' },
  { id: 'pqr', label: 'Petición, queja o reclamo' },
  { id: 'felicitacion', label: 'Felicitación' },
  { id: 'otro', label: 'Otro tema' },
] as const;

export type ContactReasonId = (typeof CONTACT_REASONS)[number]['id'];

/** Límites para que el mensaje llegue completo y no se use para enviar basura. */
export const CONTACT_LIMITS = { name: 80, contact: 120, message: 1200 } as const;
