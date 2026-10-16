import { useSyncExternalStore } from 'react';
import { getProfile, subscribeProfile, type UserProfile } from '../services/profile/profileStore';

/** Perfil local del usuario; se actualiza en todos los componentes al guardarlo. */
export function useProfile(): UserProfile | null {
  return useSyncExternalStore(subscribeProfile, getProfile, getProfile);
}
