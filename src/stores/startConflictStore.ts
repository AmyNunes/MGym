import { create } from 'zustand';

export type StartConflictChoice = 'continue' | 'saveAndStart';

type Request = {
  /** O treino em andamento. */
  activeName: string;
  doneSets: number;
  /** O treino que pedi para começar. */
  nextName: string;
  resolve: (choice: StartConflictChoice | null) => void;
};

/** Pergunta "Continuar esse treino" ou "Salvar esse e começar o novo" (folha global, no layout raiz). */
export const useStartConflict = create<{ request: Request | null }>()(() => ({ request: null }));

/** Abre a folha e espera a resposta (`null` = fechei sem escolher). */
export function askStartConflict(info: Omit<Request, 'resolve'>): Promise<StartConflictChoice | null> {
  return new Promise((resolve) => {
    useStartConflict.getState().request?.resolve(null);
    useStartConflict.setState({ request: { ...info, resolve } });
  });
}

export function answerStartConflict(choice: StartConflictChoice | null) {
  const { request } = useStartConflict.getState();
  useStartConflict.setState({ request: null });
  request?.resolve(choice);
}
