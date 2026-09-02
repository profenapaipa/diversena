import type { Language } from '../../models/language';
import { buildPlaceholderSigns } from './placeholderSigns';

export const colombia: Language = {
  id: 'lsc',
  name: 'Lengua de Señas Colombiana',
  country: 'Colombia',
  signs: buildPlaceholderSigns('lsc'),
};
