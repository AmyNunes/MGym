import { NumberPad } from '@/components/workout/NumberPad';
import { addWeight } from '@/features/body/weightService';
import { strings } from '@/i18n/strings';
import { formatKgNumber } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useProfile } from '@/stores/profileStore';
import { showSnackbar } from '@/stores/snackbarStore';

const w = strings.weight;
const LIMITS = { min: 25, max: 350 };

type Props = { visible: boolean; onClose: () => void; onSaved?: () => void };

/** + › Peso (seção 11.1): o NumberPad com uma casa decimal, começando no último peso. */
export function WeightPad({ visible, onClose, onSaved }: Props) {
  const profile = useProfile((s) => s.profile);
  const hidden = profile.weightVisibility !== 'show';

  const submit = (value: number | null) => {
    if (value == null) return onClose();
    if (value < LIMITS.min || value > LIMITS.max) {
      showSnackbar(w.invalid);
      return;
    }
    onClose();
    void addWeight(value).then(() => {
      haptics.light();
      showSnackbar(hidden ? w.savedHidden : w.saved(formatKgNumber(Math.round(value * 10) / 10)));
      onSaved?.();
    });
  };

  return (
    <NumberPad
      request={
        visible
          ? {
              title: w.padTitle,
              label: w.padLabel,
              value: hidden ? null : profile.weightKg,
              decimals: true,
              step: 0.1,
              same: null,
              hasNext: false,
            }
          : null
      }
      onClose={onClose}
      onSubmit={(value) => submit(value)}
    />
  );
}
