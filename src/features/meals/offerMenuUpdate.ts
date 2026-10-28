import { strings } from '@/i18n/strings';
import { showSnackbar } from '@/stores/snackbarStore';

import { regenerateWeek } from './menuService';

const g = strings.guide;

/** Respostas de alimentação mudaram: oferece gerar o cardápio da semana de novo (sem fazer sozinho). */
export function offerMenuUpdate() {
  showSnackbar(g.menuNeedsUpdate, {
    label: g.updateMenu,
    onPress: () => void regenerateWeek(new Date()).then(() => showSnackbar(g.saved)),
  });
}
