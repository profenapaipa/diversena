import type { Language } from '../../models/language';
import { buildPlaceholderSigns } from './placeholderSigns';

export const mexico: Language = {
  id: 'lsm',
  name: 'Lengua de Señas Mexicana',
  shortName: 'LSM',
  country: 'México',
  status: 'proximamente',
  signs: buildPlaceholderSigns('lsm'),
};
