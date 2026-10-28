import { Tabs } from 'expo-router/js-tabs';

import { QuickAddButton, QuickAddHost } from '@/components/navigation/QuickAdd';
import { TabBar } from '@/components/navigation/TabBar';
import { strings } from '@/i18n/strings';

export default function TabsLayout() {
  return (
    <>
      <Tabs tabBar={(props) => <TabBar {...props} center={<QuickAddButton />} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: strings.tabs.today }} />
        <Tabs.Screen name="workout" options={{ title: strings.tabs.workout }} />
        <Tabs.Screen name="meals" options={{ title: strings.tabs.meals }} />
        <Tabs.Screen name="progress" options={{ title: strings.tabs.progress }} />
      </Tabs>
      <QuickAddHost />
    </>
  );
}
