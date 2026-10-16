import type { Language } from '../../models/language';
import { buildPlaceholderSigns } from './placeholderSigns';

export const ecuador: Language = {
  id: 'lsec',
  name: 'Lengua de Señas Ecuatoriana',
  shortName: 'LSEC',
  country: 'Ecuador',
  status: 'proximamente',
  signs: buildPlaceholderSigns('lsec'),
};
