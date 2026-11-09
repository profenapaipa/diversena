import { useSyncExternalStore } from 'react';
import { getCalibration, subscribeCalibration, type HandCalibration } from '../services/recognition/calibration';

/** La calibración de la mano de esta persona (null si todavía no la hizo). Se actualiza sola al calibrar o recalibrar. */
export function useCalibration(): HandCalibration | null {
  return useSyncExternalStore(subscribeCalibration, getCalibration, () => null);
}
