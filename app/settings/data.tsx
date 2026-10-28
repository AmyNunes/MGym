import { router, Stack } from 'expo-router';
import { useState } from 'react';

import { Button, ConfirmSheet, ListGroup, ListRow, Screen, Sheet, Text, TextField } from '@/components/ui';
import { BackupError, type Backup } from '@/features/data/backupFormat';
import { exportBackup, lastBackupAt, pickBackup, restoreBackup, wipeEverything, wipeWeightHistory } from '@/features/data/backupService';
import { strings } from '@/i18n/strings';
import { formatShortDate, formatTime } from '@/lib/dates';
import { useLoader } from '@/lib/useLoader';
import { showSnackbar } from '@/stores/snackbarStore';

const d = strings.settings.data;
const when = (iso: string) => `${formatShortDate(new Date(iso))}, ${formatTime(new Date(iso))}`;

/** Configurações › Dados (seção 12.7, item 10): backup, importar, apagar peso, apagar tudo. */
export default function DataSettingsScreen() {
  const last = useLoader(lastBackupAt);
  const [busy, setBusy] = useState<'export' | 'import' | 'wipe' | null>(null);
  const [pending, setPending] = useState<Backup | null>(null);
  const [weightsOpen, setWeightsOpen] = useState(false);
  const [wipeOpen, setWipeOpen] = useState(false);
  const [typed, setTyped] = useState('');

  const doExport = async () => {
    setBusy('export');
    try {
      await exportBackup();
      showSnackbar(d.exported);
      last.refresh();
    } catch {
      showSnackbar(strings.common.genericError);
    } finally {
      setBusy(null);
    }
  };

  const doImport = async () => {
    setBusy('import');
    try {
      const backup = await pickBackup();
      if (backup) setPending(backup);
    } catch (e) {
      showSnackbar(e instanceof BackupError ? (e.problem === 'invalid' ? d.invalid : d.newer) : strings.common.genericError);
    } finally {
      setBusy(null);
    }
  };

  const confirmImport = async () => {
    if (!pending) return;
    const backup = pending;
    setPending(null);
    setBusy('import');
    try {
      await restoreBackup(backup);
      showSnackbar(d.imported);
      router.dismissTo('/');
    } catch {
      showSnackbar(d.importFailed);
    } finally {
      setBusy(null);
    }
  };

  const doWipe = async () => {
    setBusy('wipe');
    try {
      await wipeEverything();
      setWipeOpen(false);
      showSnackbar(d.wiped);
      router.dismissTo('/');
    } catch {
      showSnackbar(d.wipeFailed);
    } finally {
      setBusy(null);
    }
  };

  const lastLabel = last.state.status === 'success' && last.state.data ? d.lastBackup(when(last.state.data)) : d.neverBackedUp;

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: d.title }} />
      <ListGroup footer={lastLabel}>
        <ListRow icon="upload-cloud" title={d.export} subtitle={d.exportHint} onPress={busy ? undefined : () => void doExport()} />
        <ListRow icon="download-cloud" title={d.import} subtitle={d.importHint} onPress={busy ? undefined : () => void doImport()} />
      </ListGroup>
      <ListGroup>
        <ListRow icon="trending-down" iconColor="warning" title={d.weights} subtitle={d.weightsHint} onPress={() => setWeightsOpen(true)} />
        <ListRow icon="trash-2" iconColor="danger" title={d.wipe} subtitle={d.wipeHint} onPress={() => setWipeOpen(true)} />
      </ListGroup>

      <ConfirmSheet
        visible={pending != null}
        onClose={() => setPending(null)}
        title={d.replaceTitle}
        message={pending ? d.replaceMessage(when(pending.exportedAt)) : ''}
        confirmLabel={d.replace}
        cancelLabel={strings.common.cancel}
        onConfirm={() => void confirmImport()}
      />
      <ConfirmSheet
        visible={weightsOpen}
        onClose={() => setWeightsOpen(false)}
        title={d.weightsTitle}
        message={d.weightsHint}
        confirmLabel={d.weightsConfirm}
        cancelLabel={strings.common.cancel}
        onConfirm={() => {
          setWeightsOpen(false);
          void wipeWeightHistory().then(
            () => showSnackbar(d.weightsDone),
            () => showSnackbar(d.weightsFailed),
          );
        }}
      />
      <Sheet visible={wipeOpen} onClose={() => setWipeOpen(false)} title={d.wipeTitle} snapPoints={['60%']}>
        <Text>{d.wipeMessage}</Text>
        <TextField label={d.wipeField} value={typed} onChangeText={setTyped} autoCapitalize="characters" autoCorrect={false} />
        <Button
          label={d.wipeConfirm}
          icon="trash-2"
          size="main"
          disabled={typed.trim().toUpperCase() !== d.wipeWord}
          loading={busy === 'wipe'}
          onPress={() => void doWipe()}
        />
      </Sheet>
    </Screen>
  );
}
