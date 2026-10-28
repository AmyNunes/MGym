import { create } from 'zustand';

import { getProfile, saveProfile } from '@/db/profileRepo';
import { createPlanFromProfile } from '@/features/plan/fromProfile';
import { emptyProfile, type Profile } from '@/profile/profile';

type State = {
  profile: Profile;
  /** Guia concluído (pelo menos uma vez). */
  completed: boolean;
  loaded: boolean;
};

/** Perfil (respostas do Guia) na memória, salvo a cada mudança. */
export const useProfile = create<State>()(() => ({ profile: emptyProfile(), completed: false, loaded: false }));

export async function loadProfile() {
  const stored = await getProfile();
  useProfile.setState({
    profile: stored?.answers ?? emptyProfile(),
    completed: stored?.completedAt != null,
    loaded: true,
  });
}

/** Muda respostas e salva (sair do Guia no meio não perde nada). */
export async function patchProfile(patch: Partial<Profile>) {
  const profile = { ...useProfile.getState().profile, ...patch };
  useProfile.setState({ profile });
  await saveProfile(profile);
}

/** Termina o Guia: marca como concluído e monta um plano novo. Devolve o id do plano. */
export async function finishGuide(): Promise<string> {
  const profile = { ...useProfile.getState().profile, screeningAnswered: true };
  await saveProfile(profile, true);
  useProfile.setState({ profile, completed: true });
  return createPlanFromProfile(profile);
}
