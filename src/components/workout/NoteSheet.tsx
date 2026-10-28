import { useState } from 'react';

import { Button, Sheet, TextField } from '@/components/ui';
import { strings } from '@/i18n/strings';

type Props = {
  visible: boolean;
  title: string;
  initial: string;
  onClose: () => void;
  onSave: (text: string) => void;
};

/** Nota de um exercício ou do treino (ex.: "banco na posição 4"). */
export function NoteSheet({ visible, title, initial, onClose, onSave }: Props) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {visible && <NoteBody initial={initial} onSave={onSave} onClose={onClose} />}
    </Sheet>
  );
}

function NoteBody({ initial, onSave, onClose }: { initial: string; onSave: (t: string) => void; onClose: () => void }) {
  const [text, setText] = useState(initial);
  return (
    <>
      <TextField
        label={strings.workout.note}
        value={text}
        onChangeText={setText}
        placeholder={strings.workout.notePlaceholder}
        multiline
        maxLength={300}
      />
      <Button
        label={strings.common.save}
        size="main"
        onPress={() => {
          onSave(text.trim());
          onClose();
        }}
      />
    </>
  );
}
