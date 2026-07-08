import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Widget } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';

interface Props { widget: Widget }

export const NotesWidget: React.FC<Props> = ({ widget }) => {
  const theme = useTheme();
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState(false);
  const KEY = `@standbyme/note/${widget.id}`;

  const settings = widget.settings as {
    placeholder?: string;
    fontSize?: number;
    textAlign?: 'left' | 'center' | 'right';
  };

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => { if (v) setContent(v); });
  }, []);

  const save = async (text: string) => {
    setContent(text);
    await AsyncStorage.setItem(KEY, text);
  };

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.accent }]}>📝</Text>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <Text style={[styles.editBtn, { color: theme.colors.textMuted }]}>
            {editing ? '✓ Done' : '✎ Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      {editing ? (
        <TextInput
          style={[
            styles.input,
            {
              color: theme.colors.text,
              fontSize: settings.fontSize ?? 14,
              textAlign: settings.textAlign ?? 'left',
            },
          ]}
          value={content}
          onChangeText={save}
          placeholder={settings.placeholder ?? 'Tap to write a note...'}
          placeholderTextColor={theme.colors.textSubtle}
          multiline
          autoFocus
        />
      ) : (
        <TouchableOpacity style={styles.textArea} onPress={() => setEditing(true)} activeOpacity={0.9}>
          <Text
            style={[
              styles.noteText,
              {
                color: content ? theme.colors.text : theme.colors.textSubtle,
                fontSize: settings.fontSize ?? 14,
                textAlign: settings.textAlign ?? 'left',
              },
            ]}
          >
            {content || (settings.placeholder ?? 'Tap to write a note...')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 18 },
  editBtn: { fontSize: 12, fontWeight: '500' },
  input: { flex: 1, textAlignVertical: 'top', lineHeight: 20 },
  textArea: { flex: 1 },
  noteText: { flex: 1, lineHeight: 20 },
});
