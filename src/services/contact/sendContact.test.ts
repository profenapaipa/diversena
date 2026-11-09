import { describe, expect, it, vi } from 'vitest';
import { CONTACT_ENDPOINT } from '../../data/contact';
import { looksLikeContact, sendContact, validateContact, type ContactMessage } from './sendContact';

const valid: ContactMessage = { reason: 'participar', name: 'Ana', contact: 'ana@correo.com', message: 'Quiero participar con mi grupo.' };
const reply = (body: object, ok = true) => vi.fn().mockResolvedValue({ ok, json: async () => body }) as unknown as typeof fetch;

describe('contacto', () => {
  it('reconoce correos y teléfonos, y rechaza lo demás', () => {
    expect(looksLikeContact('ana@correo.com')).toBe(true);
    expect(looksLikeContact('+57 300 123 4567')).toBe(true);
    expect(looksLikeContact('hola')).toBe(false);
    expect(looksLikeContact('ana@correo')).toBe(false);
  });

  it('pide nombre, un dato para responder y un mensaje con contenido', () => {
    expect(validateContact(valid)).toBeNull();
    expect(validateContact({ ...valid, name: '' })).toMatch(/nombre/);
    expect(validateContact({ ...valid, contact: 'xx' })).toMatch(/correo o un teléfono/);
    expect(validateContact({ ...valid, message: 'hola' })).toMatch(/más/);
  });

  it('envía al servicio con el motivo en el asunto y responde a quien escribió', async () => {
    const fetchMock = reply({ success: 'true' });
    const result = await sendContact(valid, fetchMock);
    expect(result).toEqual({ ok: true });
    const [url, init] = (fetchMock as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(CONTACT_ENDPOINT);
    const sent = JSON.parse(init.body);
    expect(sent._subject).toBe('DiverSeña: Quiero participar');
    expect(sent._replyto).toBe('ana@correo.com');
    expect(sent.Mensaje).toBe('Quiero participar con mi grupo.');
  });

  it('si el formulario no está activado, lo dice aparte y no lo da por enviado', async () => {
    // Es la respuesta real de FormSubmit antes de activar: success «false» y un mensaje que habla de la activación.
    const result = await sendContact(valid, reply({ success: 'false', message: 'This form needs Activation. Check your inbox.' }));
    expect(result).toMatchObject({ ok: false, reason: 'activation' });
  });

  it('detecta la activación aunque el servicio responda con un código de error', async () => {
    const result = await sendContact(valid, reply({ success: 'false', message: 'This form needs Activation.' }, false));
    expect(result).toMatchObject({ ok: false, reason: 'activation' });
  });

  it('no manda nada si el campo trampa viene lleno, pero no lo delata', async () => {
    const fetchMock = reply({ success: 'true' });
    const result = await sendContact({ ...valid, honey: 'spam' }, fetchMock);
    expect(result.ok).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('distingue una falla de red de un rechazo del servicio', async () => {
    const down = vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    expect(await sendContact(valid, down)).toMatchObject({ ok: false, reason: 'network' });
    expect(await sendContact(valid, reply({ success: 'false', message: 'no' }, false))).toMatchObject({ ok: false, reason: 'rejected' });
  });

  it('con datos inválidos ni siquiera llama a la red', async () => {
    const fetchMock = reply({ success: 'true' });
    expect(await sendContact({ ...valid, name: '' }, fetchMock)).toMatchObject({ ok: false, reason: 'invalid' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
