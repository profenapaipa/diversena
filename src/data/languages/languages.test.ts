import { describe, expect, it } from 'vitest';
import { colombia } from './colombia';

describe('contenido de las vocales de la LSC', () => {
  it('cada vocal trae imagen, explicación e instrucciones (sin marcadores pendientes)', () => {
    expect(colombia.signs.map((s) => s.letter)).toEqual(['A', 'E', 'I', 'O', 'U']);
    for (const sign of colombia.signs) {
      expect(sign.image, `imagen de ${sign.letter}`).toMatch(/senas\/lsc\/[aeiou]\.svg$/);
      expect(sign.description, `explicación de ${sign.letter}`).toBeTruthy();
      expect(sign.instructions, `instrucciones de ${sign.letter}`).toBeTruthy();
    }
  });
});
