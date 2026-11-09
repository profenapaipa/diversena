import { useState, type FormEvent } from 'react';
import { CONTACT_EMAIL, CONTACT_LIMITS, CONTACT_REASONS, type ContactReasonId } from '../data/contact';
import { sendContact, validateContact, type ContactMessage } from '../services/contact/sendContact';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const EMPTY: ContactMessage = { reason: 'informacion', name: '', contact: '', message: '', honey: '' };
/** Tiempo mínimo entre dos envíos desde el mismo navegador, para frenar el envío repetido. */
const COOLDOWN_MS = 30_000;
const LAST_SENT_KEY = 'diversena.contact.last';

function secondsLeft(): number {
  try {
    const last = Number(localStorage.getItem(LAST_SENT_KEY) ?? 0);
    return Math.max(0, Math.ceil((last + COOLDOWN_MS - Date.now()) / 1000));
  } catch {
    return 0;
  }
}

/** Contacto: participar, pedir información, una petición, queja o reclamo, o una felicitación. */
export function ContactPage() {
  const [form, setForm] = useState<ContactMessage>(EMPTY);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const set = <K extends keyof ContactMessage>(key: K, value: ContactMessage[K]) => setForm((current) => ({ ...current, [key]: value }));

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const problem = validateContact(form) ?? (consent ? null : 'Marca la casilla para que podamos usar tus datos y responderte.');
    if (problem) {
      setStatus('error');
      setMessage(problem);
      return;
    }
    const wait = secondsLeft();
    if (wait > 0) {
      setStatus('error');
      setMessage(`Ya enviaste un mensaje. Puedes enviar otro en ${wait} segundos.`);
      return;
    }
    setStatus('sending');
    const result = await sendContact(form);
    if (result.ok) {
      try {
        localStorage.setItem(LAST_SENT_KEY, String(Date.now()));
      } catch {
        // Sin almacenamiento: no se frena el reenvío, pero el envío funcionó.
      }
      setStatus('sent');
      setMessage(
        result.needsActivation
          ? 'Recibimos tu mensaje. Este es el primer envío, así que puede tardar un poco en llegar.'
          : 'Gracias. Recibimos tu mensaje y te responderemos pronto.',
      );
      setForm(EMPTY);
      setConsent(false);
    } else {
      setStatus('error');
      setMessage(
        result.reason === 'network'
          ? `No pudimos enviar el mensaje. Revisa tu conexión o escríbenos a ${CONTACT_EMAIL}.`
          : `No pudimos enviar el mensaje. Escríbenos directamente a ${CONTACT_EMAIL}.`,
      );
    }
  }

  return (
    <article className="page contact">
      <header className="page-head">
        <p className="eyebrow">Contacto</p>
        <h1>Escríbenos</h1>
        <p className="lead">Para participar, pedir información, dejarnos una petición, queja o reclamo, o decirnos qué te pareció.</p>
      </header>

      {status === 'sent' ? (
        <div className="contact-done" role="status">
          <span className="contact-done__check" aria-hidden="true">✓</span>
          <h2>Mensaje enviado</h2>
          <p>{message}</p>
          <button type="button" className="button button--secondary" onClick={() => setStatus('idle')}>
            Enviar otro mensaje
          </button>
        </div>
      ) : (
        <form className="contact-form" onSubmit={onSubmit} noValidate>
          <fieldset className="contact-form__reasons">
            <legend>¿Sobre qué quieres escribirnos?</legend>
            {CONTACT_REASONS.map((reason) => (
              <label key={reason.id} className={`contact-chip${form.reason === reason.id ? ' contact-chip--on' : ''}`}>
                <input
                  type="radio"
                  name="reason"
                  value={reason.id}
                  checked={form.reason === reason.id}
                  onChange={() => set('reason', reason.id as ContactReasonId)}
                />
                {reason.label}
              </label>
            ))}
          </fieldset>

          <label className="contact-field">
            <span>Tu nombre</span>
            <input type="text" autoComplete="name" maxLength={CONTACT_LIMITS.name} value={form.name} onChange={(e) => set('name', e.target.value)} />
          </label>
          <label className="contact-field">
            <span>Correo o teléfono para responderte</span>
            <input type="text" autoComplete="email" maxLength={CONTACT_LIMITS.contact} value={form.contact} onChange={(e) => set('contact', e.target.value)} />
          </label>
          <label className="contact-field">
            <span>Tu mensaje</span>
            <textarea rows={5} maxLength={CONTACT_LIMITS.message} value={form.message} onChange={(e) => set('message', e.target.value)} />
            <small>{form.message.length} de {CONTACT_LIMITS.message}</small>
          </label>

          {/* Campo trampa para robots: queda fuera de la vista y del teclado. */}
          <div className="contact-honey" aria-hidden="true">
            <label>
              No llenes este campo
              <input type="text" tabIndex={-1} autoComplete="off" value={form.honey} onChange={(e) => set('honey', e.target.value)} />
            </label>
          </div>

          <label className="contact-consent">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              Acepto que el semillero use estos datos solo para responderme. El mensaje se envía por correo con FormSubmit, un
              servicio externo gratuito.
            </span>
          </label>

          {status === 'error' && <p className="contact-error" role="alert">{message}</p>}

          <button type="submit" className="button button--lg" disabled={status === 'sending'} aria-busy={status === 'sending'}>
            {status === 'sending' ? 'Enviando…' : 'Enviar mensaje'}
          </button>
          <p className="note">
            También puedes escribir directamente a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </form>
      )}
    </article>
  );
}
