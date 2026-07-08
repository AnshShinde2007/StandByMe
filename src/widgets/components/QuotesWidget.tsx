import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Widget } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';

interface Props { widget: Widget }

const QUOTES = {
  motivational: [
    { q: "The secret of getting ahead is getting started.", a: "Mark Twain" },
    { q: "It does not matter how slowly you go as long as you do not stop.", a: "Confucius" },
    { q: "Everything you can imagine is real.", a: "Pablo Picasso" },
  ],
  wisdom: [
    { q: "The only true wisdom is in knowing you know nothing.", a: "Socrates" },
    { q: "Turn your wounds into wisdom.", a: "Oprah Winfrey" },
    { q: "Knowing yourself is the beginning of all wisdom.", a: "Aristotle" },
  ],
  humor: [
    { q: "I'm not superstitious, but I am a little stitious.", a: "Michael Scott" },
    { q: "I love deadlines. I like the whooshing sound they make as they fly by.", a: "Douglas Adams" },
  ]
};

export const QuotesWidget: React.FC<Props> = ({ widget }) => {
  const theme = useTheme();
  const settings = widget.settings as { category?: 'motivational' | 'wisdom' | 'humor'; showAuthor?: boolean };
  
  const category = settings.category ?? 'motivational';
  const list = QUOTES[category] || QUOTES.motivational;
  
  // Pick one deterministically based on the current day, so it changes once per day
  const todayIndex = Math.floor(Date.now() / 86400000) % list.length;
  const quote = list[todayIndex];

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <Text style={[styles.quoteMark, { color: theme.colors.border }]}>"</Text>
      <View style={styles.content}>
        <Text style={[styles.text, { color: theme.colors.text }]} adjustsFontSizeToFit numberOfLines={4}>
          {quote.q}
        </Text>
        {settings.showAuthor !== false && (
          <Text style={[styles.author, { color: theme.colors.accent }]}>— {quote.a}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, flexDirection: 'row' },
  quoteMark: { fontSize: 60, fontFamily: 'serif', lineHeight: 60, marginRight: 8, marginTop: -10 },
  content: { flex: 1, justifyContent: 'center' },
  text: { fontSize: 18, fontStyle: 'italic', fontWeight: '500', lineHeight: 26 },
  author: { fontSize: 13, marginTop: 12, fontWeight: '600' }
});
