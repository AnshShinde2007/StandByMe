import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Widget } from '../types';
import { useTheme } from '../theme/ThemeProvider';

import { WidgetRegistry } from '../engine/WidgetRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// Widget Renderer — dispatches to the correct widget component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  widget: Widget;
}

export const WidgetRenderer: React.FC<Props> = ({ widget }) => {
  const theme = useTheme();

  const definition = WidgetRegistry.get(widget.type);
  if (definition && definition.Component) {
    const Component = definition.Component;
    return <Component widget={widget} />;
  }

  return (
        <View style={[styles.unknown, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Text style={[styles.unknownText, { color: theme.colors.textMuted }]}>
            Unknown widget: {(widget as Widget).type}
          </Text>
        </View>
      );
};

const styles = StyleSheet.create({
  unknown: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  unknownText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
