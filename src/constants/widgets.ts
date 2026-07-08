import { WidgetType } from '../types';
import { WidgetRegistry } from '../engine/WidgetRegistry';
import { WidgetDefinition, SettingDefinition, WidgetSize, WIDGET_SIZE_DIMENSIONS } from '../engine/types';

import { DigitalClockWidget } from '../widgets/components/DigitalClockWidget';
import { AnalogClockWidget } from '../widgets/components/AnalogClockWidget';
import { FlipClockWidget } from '../widgets/components/FlipClockWidget';
import { WeatherWidget } from '../widgets/components/WeatherWidget';
import { CalendarWidget } from '../widgets/components/CalendarWidget';
import { NotesWidget } from '../widgets/components/NotesWidget';
import { BatteryWidget } from '../widgets/components/BatteryWidget';
import { MusicControlsWidget } from '../widgets/components/MusicControlsWidget';
import { CountdownWidget } from '../widgets/components/CountdownWidget';
import { PomodoroWidget } from '../widgets/components/PomodoroWidget';
import { StopwatchWidget } from '../widgets/components/StopwatchWidget';
import { HabitTrackerWidget } from '../widgets/components/HabitTrackerWidget';
import { QuotesWidget } from '../widgets/components/QuotesWidget';
import { WorldClockWidget } from '../widgets/components/WorldClockWidget';
import { GitHubStatsWidget } from '../widgets/components/GitHubStatsWidget';
import { LeetCodeStatsWidget } from '../widgets/components/LeetCodeStatsWidget';

// ─────────────────────────────────────────────────────────────────────────────
// Widget Registry
// ─────────────────────────────────────────────────────────────────────────────

export interface WidgetMeta {
  type: WidgetType;
  displayName: string;
  description: string;
  icon: string;
  /** Canonical size — Grid Engine converts to col/row spans */
  size: WidgetSize;
  defaultSettings: Record<string, unknown>;
  category: any;
  requiresInternet: boolean;
  Component?: any;
}

export type WidgetCategory =
  | 'time'
  | 'info'
  | 'productivity'
  | 'health'
  | 'media'
  | 'developer';

export const WIDGET_REGISTRY: WidgetMeta[] = [
  {
    type: 'digital_clock',
    displayName: 'Digital Clock',
    description: 'Large digital time display with optional date',
    icon: 'Clock',
    size: 'SMALL',
    defaultSettings: {
      showSeconds: true,
      showDate: true,
      format24h: false,
      showAmPm: true,
      fontSize: 'large',
    },
    category: 'time',
    requiresInternet: false,
  },
  {
    type: 'analog_clock',
    displayName: 'Analog Clock',
    description: 'Classic analog clock face',
    icon: 'Watch',
    size: 'SMALL',
    defaultSettings: {
      showNumbers: true,
      showDate: false,
      tickStyle: 'lines',
      handStyle: 'rounded',
    },
    category: 'time',
    requiresInternet: false,
  },
  {
    type: 'flip_clock',
    displayName: 'Flip Clock',
    description: 'Retro flip-card style clock',
    icon: 'Timer',
    size: 'MEDIUM',
    defaultSettings: {
      showSeconds: true,
      format24h: false,
    },
    category: 'time',
    requiresInternet: false,
  },
  {
    type: 'weather',
    displayName: 'Weather',
    description: 'Current weather conditions and forecast',
    icon: 'Cloud',
    size: 'SMALL',
    defaultSettings: {
      city: '',
      apiKey: '',
      unit: 'metric',
      showFeelsLike: true,
      showHumidity: true,
      showWind: false,
    },
    category: 'info',
    requiresInternet: true,
  },
  {
    type: 'calendar',
    displayName: 'Calendar',
    description: 'Monthly calendar view',
    icon: 'Calendar',
    size: 'LARGE',
    defaultSettings: {
      startOnMonday: false,
      highlightToday: true,
      showWeekNumbers: false,
    },
    category: 'info',
    requiresInternet: false,
  },
  {
    type: 'notes',
    displayName: 'Notes',
    description: 'Quick sticky notes',
    icon: 'StickyNote',
    size: 'LARGE',
    defaultSettings: {
      placeholder: 'Tap to write a note...',
      fontSize: 14,
      textAlign: 'left',
    },
    category: 'productivity',
    requiresInternet: false,
  },
  {
    type: 'battery',
    displayName: 'Battery',
    description: 'Device battery level and charging status',
    icon: 'Battery',
    size: 'SMALL',
    defaultSettings: {
      showPercentage: true,
      showStatus: true,
      style: 'bar',
    },
    category: 'info',
    requiresInternet: false,
  },
  {
    type: 'music_controls',
    displayName: 'Music Controls',
    description: 'Media playback controls',
    icon: 'Music',
    size: 'MEDIUM',
    defaultSettings: {
      showAlbumArt: true,
      showProgressBar: true,
      compact: false,
    },
    category: 'media',
    requiresInternet: false,
  },
  {
    type: 'countdown',
    displayName: 'Countdown',
    description: 'Count down to an event or date',
    icon: 'Hourglass',
    size: 'MEDIUM',
    defaultSettings: {
      label: 'Event',
      targetDate: '',
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: false,
    },
    category: 'productivity',
    requiresInternet: false,
  },
  {
    type: 'pomodoro',
    displayName: 'Pomodoro',
    description: 'Focus timer with work/break cycles',
    icon: 'Tomato',
    size: 'MEDIUM',
    defaultSettings: {
      workMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      cyclesBeforeLong: 4,
      autoStart: false,
    },
    category: 'productivity',
    requiresInternet: false,
  },
  {
    type: 'stopwatch',
    displayName: 'Stopwatch',
    description: 'Simple stopwatch with lap times',
    icon: 'StopCircle',
    size: 'MEDIUM',
    defaultSettings: {
      showLaps: true,
    },
    category: 'time',
    requiresInternet: false,
  },
  {
    type: 'habit_tracker',
    displayName: 'Habit Tracker',
    description: 'Track your daily habits',
    icon: 'CheckSquare',
    size: 'LARGE',
    defaultSettings: {
      habits: [],
      showStreak: true,
      showWeekView: true,
    },
    category: 'health',
    requiresInternet: false,
  },
  {
    type: 'quotes',
    displayName: 'Daily Quote',
    description: 'Inspiring quotes, refreshed daily',
    icon: 'Quote',
    size: 'MEDIUM',
    defaultSettings: {
      category: 'motivational',
      showAuthor: true,
    },
    category: 'info',
    requiresInternet: false,
  },
  {
    type: 'world_clock',
    displayName: 'World Clock',
    description: 'Time in multiple timezones',
    icon: 'Globe',
    size: 'SMALL',
    defaultSettings: {
      timezones: [
        { label: 'New York', tz: 'America/New_York' },
        { label: 'London', tz: 'Europe/London' },
        { label: 'Tokyo', tz: 'Asia/Tokyo' },
      ],
      format24h: false,
    },
    category: 'time',
    requiresInternet: false,
  },
  {
    type: 'github_stats',
    displayName: 'GitHub Stats',
    description: 'Contribution graph and streak',
    icon: 'Github',
    size: 'MEDIUM',
    defaultSettings: {
      username: '',
      showStreak: true,
      showContribGraph: true,
    },
    category: 'developer',
    requiresInternet: true,
  },
  {
    type: 'leetcode_stats',
    displayName: 'LeetCode Stats',
    description: 'Problems solved and daily streak',
    icon: 'Code2',
    size: 'MEDIUM',
    defaultSettings: {
      username: '',
      showEasy: true,
      showMedium: true,
      showHard: true,
    },
    category: 'developer',
    requiresInternet: true,
  },
];

export const getWidgetMeta = (type: WidgetType): WidgetMeta =>
  WIDGET_REGISTRY.find((w) => w.type === type) ?? WIDGET_REGISTRY[0];

export const getWidgetsByCategory = (category: any): WidgetMeta[] =>
  WIDGET_REGISTRY.filter((w) => w.category === category);

export const WIDGET_CATEGORIES: { id: any; label: string; icon: string }[] = [
  { id: 'time', label: 'Time', icon: 'Clock' },
  { id: 'info', label: 'Info', icon: 'Info' },
  { id: 'productivity', label: 'Productivity', icon: 'Target' },
  { id: 'health', label: 'Health', icon: 'Heart' },
  { id: 'media', label: 'Media', icon: 'Music' },
  { id: 'developer', label: 'Developer', icon: 'Code2' },
];

const componentsMap: Record<string, any> = {
  digital_clock: DigitalClockWidget,
  analog_clock: AnalogClockWidget,
  flip_clock: FlipClockWidget,
  weather: WeatherWidget,
  calendar: CalendarWidget,
  notes: NotesWidget,
  battery: BatteryWidget,
  music_controls: MusicControlsWidget,
  countdown: CountdownWidget,
  pomodoro: PomodoroWidget,
  stopwatch: StopwatchWidget,
  habit_tracker: HabitTrackerWidget,
  quotes: QuotesWidget,
  world_clock: WorldClockWidget,
  github_stats: GitHubStatsWidget,
  leetcode_stats: LeetCodeStatsWidget,
};

WIDGET_REGISTRY.forEach(meta => {
  const dims = WIDGET_SIZE_DIMENSIONS[meta.size];
  const settings = Object.entries(meta.defaultSettings).map(([key, val]) => {
    let type: any = 'text';
    if (typeof val === 'boolean') type = 'toggle';
    else if (typeof val === 'number') type = 'number';
    return {
      id: key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(),
      type,
      defaultValue: val,
    };
  });

  WidgetRegistry.register({
    type: meta.type,
    displayName: meta.displayName,
    description: meta.description,
    icon: meta.icon,
    category: meta.category,
    size: meta.size,
    requiresInternet: meta.requiresInternet,
    settings,
    Component: componentsMap[meta.type],
  });
});

