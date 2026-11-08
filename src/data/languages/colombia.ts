import type { Language, VowelLetter } from '../../models/language';
import { buildPlaceholderSigns } from './placeholderSigns';

/**
 * Qué se enseña en Aprender para cada vocal de la LSC.
 *
 * Los dibujos (public/senas/lsc) los hizo el equipo con los 21 puntos de la
 * mano y el Diccionario de LSC del INSOR como referencia
 * (https://educativo.insor.gov.co/diccionario/). Los textos describen lo que
 * reconoce la página hoy, que sale de grabaciones del equipo: todavía falta
 * validarlos con personas Sordas y docentes de LSC, y por eso en la pantalla
 * se dice. No hay video propio publicado: los videos del equipo son de una
 * persona menor de edad y no se publican, así que Aprender no muestra ese
 * bloque en lugar de dejar un marcador vacío.
 */
const CONTENIDO: Record<VowelLetter, { description: string; instructions: string }> = {
  A: {
    description: 'Puño cerrado con el pulgar extendido al lado de los dedos.',
    instructions:
      'Pon la mano completa dentro del cuadro, a la altura del pecho. Cierra los cuatro dedos en un puño y deja el pulgar extendido. Sostén la seña un segundo.',
  },
  E: {
    description: 'Dedos doblados como una garra sobre la palma, con el pulgar doblado debajo.',
    instructions:
      'Dobla los cuatro dedos hacia la palma y esconde el pulgar debajo de las puntas. Es la vocal que más se parece a la O: en la E los dedos se doblan sobre la palma y en la O forman un círculo con el pulgar.',
  },
  I: {
    description: 'Meñique arriba y los demás dedos cerrados, con el pulgar encima.',
    instructions: 'Cierra el puño con el pulgar sobre los dedos y levanta solo el meñique. Sostén la seña un segundo.',
  },
  O: {
    description: 'Dedos curvos con el pulgar tocando las puntas, como un círculo.',
    instructions: 'Curva los dedos hacia el pulgar hasta que las puntas se toquen y se forme un círculo. Sostén la seña un segundo.',
  },
  U: {
    description: 'Índice y meñique arriba; medio y anular cerrados, con el pulgar encima.',
    instructions:
      'Levanta el índice y el meñique, y cierra el medio y el anular con el pulgar encima. Es la U de la LSC, distinta a la de otras lenguas de señas. Sostén la seña un segundo.',
  },
};

const BASE = import.meta.env.BASE_URL;

export const colombia: Language = {
  id: 'lsc',
  name: 'Lengua de Señas Colombiana',
  shortName: 'LSC',
  country: 'Colombia',
  status: 'disponible',
  signs: buildPlaceholderSigns('lsc').map((sign) => ({
    ...sign,
    image: `${BASE}senas/lsc/${sign.letter.toLowerCase()}.svg`,
    description: CONTENIDO[sign.letter].description,
    instructions: CONTENIDO[sign.letter].instructions,
  })),
};
