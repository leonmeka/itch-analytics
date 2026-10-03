import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Typography } from 'heroui-native/text';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

export type PickedFile = {
  name: string;
  text: string;
};

type FileInputProps = {
  onFile: (file: PickedFile) => void;
  isDisabled?: boolean;
  label?: string;
};

export function FileInput({ onFile, isDisabled, label = 'Choose file' }: FileInputProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'application/csv', 'text/plain'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];

    setReading(true);

    try {
      const file = new File(asset.uri);
      const text = await file.text();

      setFileName(asset.name);
      onFile({ name: asset.name, text });
    } finally {
      setReading(false);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      className="flex-row items-center gap-3 rounded-xl border border-border bg-surface-secondary px-4 py-3 active:bg-surface-tertiary"
      disabled={isDisabled}
      onPress={() => void pick()}
    >
      {reading ? (
        <ActivityIndicator size="small" color="#8f8f99" />
      ) : (
        <View className="h-9 w-9 items-center justify-center rounded-lg bg-accent/15">
          <Typography className="text-accent">CSV</Typography>
        </View>
      )}

      <View className="flex-1">
        <Typography type="body-sm" className="text-foreground">
          {fileName ?? label}
        </Typography>
        <Typography type="body-xs" className="text-muted">
          {fileName ? 'Tap to replace' : 'itch.io export-purchases CSV'}
        </Typography>
      </View>
    </Pressable>
  );
}
