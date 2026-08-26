import type { Language } from '../../models/language';
import { buildPlaceholderSigns } from './placeholderSigns';

export const mexico: Language = {
  id: 'lsm',
  name: 'Lengua de Señas Mexicana',
  country: 'México',
  signs: buildPlaceholderSigns('lsm'),
};
