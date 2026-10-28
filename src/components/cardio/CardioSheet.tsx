import { useState } from 'react';
import { View } from 'react-native';

import { Button, Chip, Notice, Sheet, Stepper, Text } from '@/components/ui';
import { CARDIO_KINDS, deleteCardio, insertCardio, type CardioKind } from '@/db/cardioRepo';
import { strings } from '@/i18n/strings';
import { appDayKey, nowIso } from '@/lib/dates';
import { haptics } from '@/lib/haptics';
import { usesEstrogen } from '@/profile/profile';
import { recoveryState } from '@/safety/recovery';
import { useProfile } from '@/stores/profileStore';
import { showSnackbar } from '@/stores/snackbarStore';
import { makeStyles } from '@/theme';

const c = strings.cardio;
const QUICK_MINUTES = [10, 20, 30, 45, 60];

type Props = { visible: boolean; onClose: () => void; onSaved?: () => void };

/** Registro rápido de cardio (seção 9.7): escolher o tipo e os minutos, sem digitar. */
export function CardioSheet({ visible, onClose, onSaved }: Props) {
  return (
    <Sheet visible={visible} onClose={onClose} title={c.title} snapPoints={['75%']}>
      {visible && <CardioForm onClose={onClose} onSaved={onSaved} />}
    </Sheet>
  );
}

function CardioForm({ onClose, onSaved }: { onClose: () => void; onSaved?: () => void }) {
  const styles = useStyles();
  const profile = useProfile((s) => s.profile);
  const recovery = recoveryState(profile.surgery, appDayKey(new Date()));
  const kinds = CARDIO_KINDS.filter((k) => !(recovery.noBike && k === 'bike'));
  const [kind, setKind] = useState<CardioKind>(recovery.active ? 'walk' : 'inclineWalk');
  const [minutes, setMinutes] = useState(30);

  const save = async () => {
    const id = await insertCardio({ date: nowIso(), kind, minutes, notes: null });
    haptics.light();
    onClose();
    onSaved?.();
    showSnackbar(c.saved(minutes), {
      label: c.undo,
      onPress: () => void deleteCardio(id).then(() => onSaved?.()),
    });
  };

  return (
    <>
      <Text variant="label" color="textMuted">
        {c.kind}
      </Text>
      <View style={styles.chips}>
        {kinds.map((k) => (
          <Chip key={k} label={c.kinds[k]} selected={k === kind} onPress={() => setKind(k)} />
        ))}
      </View>
      <Text variant="label" color="textMuted">
        {c.minutes}
      </Text>
      <View style={styles.chips}>
        {QUICK_MINUTES.map((m) => (
          <Chip key={m} label={c.minutesValue(m)} selected={m === minutes} onPress={() => setMinutes(m)} />
        ))}
      </View>
      <Stepper accessibilityLabel={c.minutes} value={minutes} min={5} max={240} step={5} format={c.minutesValue} onChange={setMinutes} />
      {recovery.active ? (
        <Notice tone="warning">{c.recoveryTip}</Notice>
      ) : (
        <Notice icon="info">{usesEstrogen(profile) ? `${c.tip} ${c.hrtTip}` : c.tip}</Notice>
      )}
      <Button label={c.save} icon="check" size="main" onPress={() => void save()} />
    </>
  );
}

const useStyles = makeStyles((t) => ({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
}));
