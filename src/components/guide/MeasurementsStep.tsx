import { router } from 'expo-router';

import { Button, Notice } from '@/components/ui';
import { listMeasurements } from '@/db/bodyRepo';
import { strings } from '@/i18n/strings';
import { useLoader } from '@/lib/useLoader';

const g = strings.guide.measurements;

/** Pergunta 13 (opcional): medidas iniciais com o guia de como medir. */
export function MeasurementsStep() {
  const { state } = useLoader(listMeasurements);
  const measured = state.status === 'success' && state.data.length > 0;
  return (
    <>
      {measured && <Notice icon="check">{g.measured}</Notice>}
      <Button label={g.measureNow} icon="maximize-2" variant="secondary" onPress={() => router.push('/progress/measure')} />
    </>
  );
}
