/**
 * Frases de privacidad de la plataforma. Se escriben una sola vez para que digan lo mismo en el carrusel, la portada, el
 * permiso de la cámara y el pie de página.
 *
 * Lo que es cierto, y por eso lo único que se afirma: el detector de manos corre en el propio equipo de la persona y
 * analiza cada cuadro de la cámara para ubicar 21 puntos por mano; de ahí en adelante solo se usan esos puntos. La
 * imagen no se guarda ni se envía a ningún servidor. (Lo que sí se descarga es el modelo del detector, que es un archivo
 * igual para todas las personas.) No se dice que «la imagen no se procesa», porque el detector sí la analiza, en el
 * equipo de quien la usa.
 */
export const PRIVACY_SHORT = 'Solo se usan 21 puntos de tus manos. Tu imagen no se guarda ni se envía.';

export const PRIVACY_LONG =
  'El detector funciona en tu propio equipo y, de cada cuadro de la cámara, solo conserva 21 puntos de cada mano. Tu imagen no se guarda, no se envía a ningún servidor y no se usa para reconocer tu rostro.';

/** Para el momento previo al permiso de la cámara. */
export const PRIVACY_BEFORE_PERMISSION = `Te vamos a pedir permiso para usar la cámara. ${PRIVACY_SHORT}`;
