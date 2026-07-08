import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  TextInput,
  Animated,
  Platform,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BUILT_IN_THEMES } from '../constants/themes';
import { useThemeStore } from '../store/themeStore';
import { useDashboardStore } from '../store/dashboardStore';
import { useWidgetStore } from '../store/widgetStore';
import { RootStackParamList } from '../navigation/AppNavigator';

// const { width, height } = Dimensions.get('window'); // Removed static Dimensions
const ONBOARDING_DONE_KEY = '@standbyme/onboarding_done';

type Nav = StackNavigationProp<RootStackParamList, 'Onboarding'>;

const STEPS = ['Theme', 'Dashboard', 'Ready'];

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding Screen — 3-step wizard
// ─────────────────────────────────────────────────────────────────────────────
export const OnboardingScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const [selectedThemeId, setSelectedThemeId] = useState('amoled');
  const [dashboardName, setDashboardName] = useState('Home');
  const [layoutColumns, setLayoutColumns] = useState<2 | 4 | 6>(4);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const setActiveTheme = useThemeStore((s) => s.setActiveTheme);
  const createDashboard = useDashboardStore((s) => s.createDashboard);
  const addWidget = useWidgetStore((s) => s.addWidget);

  const goNext = () => {
    Animated.timing(slideAnim, {
      toValue: -(step + 1) * width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setStep((s) => s + 1));
  };

  const goBack = () => {
    Animated.timing(slideAnim, {
      toValue: -(step - 1) * width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setStep((s) => s - 1));
  };

  const handleFinish = async () => {
    try {
      await setActiveTheme(selectedThemeId);
      const dashboard = await createDashboard(
        dashboardName || 'Home',
        selectedThemeId,
        layoutColumns
      );
      // Seed starter widgets
      await addWidget(dashboard.id, 'digital_clock', 0, 0);
      await addWidget(dashboard.id, 'weather', 2, 0);
      await addWidget(dashboard.id, 'calendar', 0, 2);
      await addWidget(dashboard.id, 'battery', 2, 2);
      await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true');
      nav.replace('Main');
    } catch (e) {
      console.error('Onboarding finish error:', e);
    }
  };

  const activeTheme = BUILT_IN_THEMES.find((t) => t.id === selectedThemeId) ?? BUILT_IN_THEMES[0];

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
      <StatusBar hidden />

      {/* Progress dots */}
      <View style={styles.progressRow}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i <= step ? activeTheme.colors.accent : activeTheme.colors.border,
                transform: [{ scale: i === step ? 1.3 : 1 }],
              },
            ]}
          />
        ))}
      </View>

      <Animated.View style={[styles.slidesContainer, { width: width * 3, transform: [{ translateX: slideAnim }] }]}>
        {/* ── Step 0: Theme Picker ── */}
        <View style={[styles.slide, { width }]}>
          <Text style={[styles.heading, { color: activeTheme.colors.text }]}>
            Choose Your Style
          </Text>
          <Text style={[styles.subheading, { color: activeTheme.colors.textMuted }]}>
            Pick a theme to get started. You can change it anytime.
          </Text>
          <ScrollView
            contentContainerStyle={styles.themeGrid}
            showsVerticalScrollIndicator={false}
          >
            {BUILT_IN_THEMES.map((theme) => {
              const isSelected = theme.id === selectedThemeId;
              return (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.themeCard,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, width: (width - 64 - 36) / 4 },
                    isSelected && { borderColor: activeTheme.colors.accent, borderWidth: 2.5 },
                  ]}
                  onPress={() => setSelectedThemeId(theme.id)}
                  activeOpacity={0.8}
                >
                  {/* Mini preview */}
                  <View style={[styles.themePreview, { backgroundColor: theme.colors.background }]}>
                    <View style={[styles.previewBar, { backgroundColor: theme.colors.accent, width: '70%' }]} />
                    <View style={[styles.previewBar, { backgroundColor: theme.colors.textMuted, width: '50%' }]} />
                    <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                      <View style={[styles.previewChip, { backgroundColor: theme.colors.surface }]} />
                      <View style={[styles.previewChip, { backgroundColor: theme.colors.accentMuted }]} />
                    </View>
                  </View>
                  <Text style={[styles.themeName, { color: theme.colors.text }]}>{theme.name}</Text>
                  {isSelected && (
                    <View style={[styles.checkmark, { backgroundColor: activeTheme.colors.accent }]}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: activeTheme.colors.accent }]}
            onPress={goNext}
          >
            <Text style={[styles.btnText, { color: activeTheme.colors.onAccent }]}>Continue →</Text>
          </TouchableOpacity>
        </View>

        {/* ── Step 1: Dashboard Name + Layout ── */}
        <View style={[styles.slide, { width }]}>
          <Text style={[styles.heading, { color: activeTheme.colors.text }]}>
            Name Your Dashboard
          </Text>
          <Text style={[styles.subheading, { color: activeTheme.colors.textMuted }]}>
            You can create multiple dashboards later (Work, Bedside, Gym…)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: activeTheme.colors.surface,
                borderColor: activeTheme.colors.border,
                color: activeTheme.colors.text,
              },
            ]}
            value={dashboardName}
            onChangeText={setDashboardName}
            placeholder="e.g. Home, Work, Bedside"
            placeholderTextColor={activeTheme.colors.textSubtle}
            maxLength={30}
          />

          <Text style={[styles.sectionLabel, { color: activeTheme.colors.textMuted }]}>
            Grid Layout
          </Text>
          <View style={styles.layoutRow}>
            {([2, 4, 6] as const).map((cols) => (
              <TouchableOpacity
                key={cols}
                style={[
                  styles.layoutBtn,
                  {
                    backgroundColor: activeTheme.colors.surface,
                    borderColor:
                      layoutColumns === cols ? activeTheme.colors.accent : activeTheme.colors.border,
                    borderWidth: layoutColumns === cols ? 2 : 1,
                  },
                ]}
                onPress={() => setLayoutColumns(cols)}
              >
                {/* Visual grid preview */}
                <View style={{ flexDirection: 'row', gap: 2, marginBottom: 6 }}>
                  {Array.from({ length: cols }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.gridPreviewCell,
                        {
                          backgroundColor:
                            layoutColumns === cols
                              ? activeTheme.colors.accent
                              : activeTheme.colors.border,
                          flex: 1,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.layoutBtnText, { color: activeTheme.colors.text }]}>
                  {cols} Column{cols > 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity onPress={goBack} style={styles.backBtn}>
              <Text style={[styles.backBtnText, { color: activeTheme.colors.textMuted }]}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: activeTheme.colors.accent, flex: 1 }]}
              onPress={goNext}
            >
              <Text style={[styles.btnText, { color: activeTheme.colors.onAccent }]}>Continue →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Step 2: Ready ── */}
        <View style={[styles.slide, { width, alignItems: 'center' }]}>
          <View style={[styles.logoCircle, { backgroundColor: activeTheme.colors.accent }]}>
            <Text style={styles.logoEmoji}>📱</Text>
          </View>
          <Text style={[styles.heading, { color: activeTheme.colors.text, textAlign: 'center' }]}>
            You're all set!
          </Text>
          <Text style={[styles.subheading, { color: activeTheme.colors.textMuted, textAlign: 'center' }]}>
            Your "{dashboardName}" dashboard is ready with starter widgets.{'\n'}
            Long-press anywhere to enter edit mode and customize everything.
          </Text>

          <View style={styles.hintsList}>
            {[
              ['⚡', 'Long-press → Edit Mode', 'Drag & resize widgets'],
              ['🎨', 'Themes', 'Switch between 8 built-in themes'],
              ['⚙️', 'Automation', 'Auto-launch on charge or schedule'],
              ['📦', 'Import / Export', 'Share dashboards as JSON'],
            ].map(([icon, title, desc]) => (
              <View key={title} style={[styles.hint, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}>
                <Text style={styles.hintIcon}>{icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.hintTitle, { color: activeTheme.colors.text }]}>{title}</Text>
                  <Text style={[styles.hintDesc, { color: activeTheme.colors.textMuted }]}>{desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity onPress={goBack} style={styles.backBtn}>
              <Text style={[styles.backBtnText, { color: activeTheme.colors.textMuted }]}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: activeTheme.colors.accent, flex: 1 }]}
              onPress={handleFinish}
            >
              <Text style={[styles.btnText, { color: activeTheme.colors.onAccent }]}>
                Launch Dashboard 🚀
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 20 : 44,
    paddingBottom: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  slidesContainer: { flexDirection: 'row' },
  slide: { paddingHorizontal: 32, paddingBottom: 24, flex: 1, justifyContent: 'center' },
  heading: { fontSize: 30, fontWeight: '700', marginBottom: 8 },
  subheading: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 16,
  },
  themeCard: {
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    position: 'relative',
    overflow: 'hidden',
  },
  themePreview: {
    height: 56,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    gap: 4,
  },
  previewBar: { height: 6, borderRadius: 3 },
  previewChip: { height: 16, flex: 1, borderRadius: 4 },
  themeName: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 24,
  },
  sectionLabel: { fontSize: 13, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  layoutRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  layoutBtn: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  gridPreviewCell: { height: 24, borderRadius: 3 },
  layoutBtnText: { fontSize: 12, fontWeight: '600' },
  btn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { fontSize: 16, fontWeight: '700' },
  navRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 8 },
  backBtn: { paddingHorizontal: 8, paddingVertical: 16 },
  backBtnText: { fontSize: 15, fontWeight: '500' },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoEmoji: { fontSize: 44 },
  hintsList: { gap: 10, width: '100%', marginBottom: 24 },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  hintIcon: { fontSize: 22 },
  hintTitle: { fontSize: 14, fontWeight: '600' },
  hintDesc: { fontSize: 12, marginTop: 2 },
});
