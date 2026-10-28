import { useState } from 'react';
import { View } from 'react-native';

import { Button, Sheet, Text } from '@/components/ui';
import { formatPad, parsePad, pressKey, stepPad, type PadKey } from '@/features/workout/padInput';
import { strings } from '@/i18n/strings';
import { haptics } from '@/lib/haptics';
import { makeStyles } from '@/theme';

import { PadButton } from './PadButton';
import { PlateLine } from './PlateLine';

const p = strings.workout.pad;

export type PadRequest = {
  /** "Elevação pélvica · série 2" */
  title: string;
  /** "Carga (kg)", "Repetições"… */
  label: string;
  value: number | null;
  decimals: boolean;
  /** Incremento do −/+ (do peso configurado, ou 1 repetição). */
  step: number;
  /** Valor da série anterior, para "Igual à anterior". */
  same: number | null;
  /** Mostra "Próximo" (do kg para as repetições). */
  hasNext: boolean;
  /** Peso da barra: mostra a calculadora de anilhas (só em exercícios com barra). */
  barKg?: number | null;
};

type Props = {
  request: PadRequest | null;
  onClose: () => void;
  onSubmit: (value: number | null, next: boolean) => void;
};

const KEYS: PadKey[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [',', '0', 'back'],
];

/** Teclado numérico grande em sheet (seção 4.4), com −/+ incremento e "Igual à anterior". */
export function NumberPad({ request, onClose, onSubmit }: Props) {
  return (
    <Sheet visible={request != null} onClose={onClose} title={request?.title} snapPoints={['85%']}>
      {request && <PadBody key={`${request.title}|${request.label}`} request={request} onSubmit={onSubmit} />}
    </Sheet>
  );
}

function PadBody({ request, onSubmit }: { request: PadRequest; onSubmit: Props['onSubmit'] }) {
  const styles = useStyles();
  const [text, setText] = useState(formatPad(request.value));
  const [fresh, setFresh] = useState(true);
  const stepLabel = formatPad(request.step);

  const type = (key: PadKey) => {
    haptics.light();
    setText(pressKey(text, key, request.decimals, fresh));
    setFresh(false);
  };
  const step = (delta: number) => {
    setText(stepPad(text, delta));
    setFresh(false);
  };

  return (
    <View style={styles.body}>
      <Text variant="label" color="textMuted" align="center">
        {request.label}
      </Text>
      <Text variant="hero" align="center" accessibilityLiveRegion="polite" style={fresh && styles.fresh}>
        {text || strings.workout.noValue}
      </Text>

      {request.barKg != null && <PlateLine total={parsePad(text)} barKg={request.barKg} />}

      <View style={styles.row}>
        <PadButton label={p.minus(stepLabel)} a11y={p.minusLabel(stepLabel)} onPress={() => step(-request.step)} />
        <PadButton label={p.plus(stepLabel)} a11y={p.plusLabel(stepLabel)} onPress={() => step(request.step)} />
        {request.same != null && (
          <PadButton
            label={strings.workout.sameAsPrevious}
            onPress={() => {
              setText(formatPad(request.same));
              setFresh(false);
            }}
          />
        )}
      </View>

      {KEYS.map((row) => (
        <View key={row.join('')} style={styles.row}>
          {row.map((key) =>
            key === ',' && !request.decimals ? (
              <View key={key} style={styles.spacer} />
            ) : (
              <PadButton
                key={key}
                label={key === 'back' ? undefined : key}
                icon={key === 'back' ? 'delete' : undefined}
                a11y={key === 'back' ? p.backspace : key === ',' ? p.decimal : key}
                big
                onPress={() => type(key)}
              />
            ),
          )}
        </View>
      ))}

      <View style={styles.row}>
        {request.hasNext && (
          <View style={styles.flex}>
            <Button label={p.next} variant="secondary" size="main" onPress={() => onSubmit(parsePad(text), true)} />
          </View>
        )}
        <View style={styles.flex}>
          <Button label={p.done} size="main" onPress={() => onSubmit(parsePad(text), false)} />
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  body: { gap: t.spacing.sm },
  fresh: { opacity: t.opacity.pressed },
  row: { flexDirection: 'row', gap: t.spacing.sm },
  flex: { flex: 1 },
  spacer: { flex: 1 },
}));
