# Contacto

El formulario de `#/contacto` manda cada mensaje por correo a `profenapaipa@gmail.com` sin servidor propio, con
[FormSubmit](https://formsubmit.co) (gratuito, sin cuenta).

## Cómo funciona

1. La persona elige el motivo (participar, información, petición, queja o reclamo, felicitación u otro), deja su nombre, un
   correo o teléfono y el mensaje, y acepta que se usen sus datos solo para responderle.
2. El navegador envía un `POST` con JSON a `https://formsubmit.co/ajax/<correo>`.
3. FormSubmit reenvía el mensaje al correo, con el asunto `DiverSeña: <motivo>`. Si la persona dejó un correo, al pulsar
   «Responder» en el buzón la respuesta va directo a ella (`_replyto`).

## Activación (una sola vez)

La primera vez que alguien envíe un mensaje, FormSubmit manda un correo de activación a `profenapaipa@gmail.com` con un
botón. **Hay que abrirlo una vez**; hasta entonces FormSubmit responde `success: "false"` con un mensaje de activación y el mensaje **no llega** (no queda en espera). La pantalla lo dice aparte y pide escribir al correo. Si el enlace del primer correo sale inválido, se pide uno nuevo enviando otro mensaje desde el sitio. Conviene enviar uno de prueba desde el sitio
publicado y activar.

Después de activar, FormSubmit entrega un código aleatorio (por ejemplo `a1b2c3…`). Se puede usar en lugar del correo en
`CONTACT_ENDPOINT` (`src/data/contact.ts`) para no dejar el correo a la vista en el código de la página.

## Protecciones

- Campo trampa (`honey`) para robots: no se ve ni se llena por teclado; si trae algo, el envío se descarta sin avisar.
- Espera de 30 segundos entre dos envíos desde el mismo navegador.
- Límites: nombre 80, contacto 120 y mensaje 1200 caracteres.
- Si falla la red o el servicio, la pantalla pide escribir directamente al correo.

## Límites del servicio gratuito

FormSubmit es gratuito pero depende de un tercero: si cambia sus condiciones, hay que cambiar el servicio. Alternativas del
mismo estilo: Web3Forms y Formspree (con cuenta y llave). Solo cambia `CONTACT_ENDPOINT` y la forma del cuerpo en
`src/services/contact/sendContact.ts`.

## Privacidad

El mensaje y los datos de contacto pasan por FormSubmit. El formulario lo dice con claridad junto a la casilla de aceptación.
No se guarda nada en este sitio, salvo la hora del último envío en el navegador, para la espera entre mensajes.

## Para llevarlo a otro sitio (por ejemplo Sinapsis Education)

Se copian cuatro archivos y se agrega la ruta y el enlace:

- `src/data/contact.ts` (correo, motivos y límites)
- `src/services/contact/sendContact.ts` y su prueba `sendContact.test.ts`
- `src/pages/ContactPage.tsx`
- los estilos que empiezan en `/* ---------- Contacto ---------- */` de `src/index.css`

Hay que cambiar el prefijo `DiverSeña:` del asunto y la clave `diversena.contact.last` por los del otro sitio.
