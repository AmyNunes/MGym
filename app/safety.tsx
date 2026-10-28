import { Stack } from 'expo-router';
import { Linking } from 'react-native';

import { CareList } from '@/components/plan/CareList';
import { BulletList, Button, Card, Notice, Screen, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { appDayKey } from '@/lib/dates';
import { careItems } from '@/safety/care';
import { useProfile } from '@/stores/profileStore';

const s = strings.safety;
const sec = s.sections;

/** Ajuda e segurança (seção 16): sinais de alerta, suplementos e contatos. Sempre acessível. */
export default function SafetyScreen() {
  const profile = useProfile((st) => st.profile);
  const care = careItems(profile, appDayKey(new Date()));

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: s.title }} />
      <Notice icon="shield">{s.disclaimer}</Notice>

      <Card title={sec.emergency.title}>
        <BulletList items={sec.emergency.items} />
        <Button label={s.callSamu} icon="phone" onPress={() => void Linking.openURL('tel:192')} />
      </Card>

      {care.length > 0 && (
        <Card title={s.forYou}>
          <CareList items={care} />
        </Card>
      )}

      <Card title={sec.clots.title}>
        <Text>{sec.clots.intro}</Text>
        <BulletList items={sec.clots.items} />
      </Card>
      <Card title={sec.extreme.title}>
        <BulletList items={sec.extreme.items} />
      </Card>
      <Card title={sec.doctorSoon.title}>
        <BulletList items={sec.doctorSoon.items} />
      </Card>
      <Card title={sec.training.title}>
        <BulletList items={sec.training.items} />
      </Card>
      <Card title={sec.supplementsOk.title}>
        <BulletList items={sec.supplementsOk.items} />
      </Card>
      <Card title={sec.supplementsNo.title}>
        <BulletList items={sec.supplementsNo.items} />
      </Card>
      <Card title={sec.eating.title}>
        <Text>{sec.eating.intro}</Text>
        <BulletList items={sec.eating.items} />
      </Card>
      <Card title={sec.contacts.title}>
        <BulletList items={sec.contacts.items} />
        <Button label={s.callCvv} icon="phone" variant="secondary" onPress={() => void Linking.openURL('tel:188')} />
      </Card>
    </Screen>
  );
}
