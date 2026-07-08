import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { Widget, WeatherData } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';
import { useWidgetRefresh } from '../../engine/RefreshManager';

interface Props { widget: Widget }

const WEATHER_ICONS: Record<string, string> = {
  '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '🌤️',
  '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️', '13d': '🌨️', '13n': '🌨️',
  '50d': '🌫️', '50n': '🌫️',
};

export const WeatherWidget: React.FC<Props> = ({ widget }) => {
  const theme = useTheme();
  const settings = widget.settings as {
    city?: string;
    apiKey?: string;
    unit?: 'metric' | 'imperial';
    showFeelsLike?: boolean;
    showHumidity?: boolean;
    showWind?: boolean;
  };

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    if (!settings.city || !settings.apiKey) {
      setError('Set city & API key in widget settings');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const unit = settings.unit ?? 'metric';
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(settings.city)}&appid=${settings.apiKey}&units=${unit}`
      );
      const d = res.data;
      setWeather({
        city: d.name,
        temp: Math.round(d.main.temp),
        feelsLike: Math.round(d.main.feels_like),
        description: d.weather[0].description,
        icon: d.weather[0].icon,
        humidity: d.main.humidity,
        windSpeed: d.wind.speed,
        high: Math.round(d.main.temp_max),
        low: Math.round(d.main.temp_min),
        fetchedAt: Date.now(),
      });
    } catch {
      setError('Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  }, [settings.city, settings.apiKey, settings.unit]);

  useWidgetRefresh(
    (widget.refreshInterval || 600) * 1000,
    fetchWeather
  );

  const unit = settings.unit === 'imperial' ? '°F' : '°C';
  const windUnit = settings.unit === 'imperial' ? 'mph' : 'm/s';

  if (loading && !weather) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        <TouchableOpacity onPress={fetchWeather} style={[styles.retryBtn, { backgroundColor: theme.colors.accent }]}>
          <Text style={{ color: theme.colors.onAccent, fontSize: 12 }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!weather) return null;

  const icon = WEATHER_ICONS[weather.icon] ?? '🌡️';

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={styles.main}>
        <Text style={styles.icon}>{icon}</Text>
        <View>
          <Text style={[styles.temp, { color: theme.colors.text }]}>
            {weather.temp}{unit}
          </Text>
          <Text style={[styles.city, { color: theme.colors.textMuted }]}>{weather.city}</Text>
          <Text style={[styles.desc, { color: theme.colors.textSubtle }]} numberOfLines={1}>
            {weather.description}
          </Text>
        </View>
      </View>
      <View style={[styles.details, { borderTopColor: theme.colors.border }]}>
        <Text style={[styles.detailText, { color: theme.colors.textMuted }]}>
          H:{weather.high}{unit} L:{weather.low}{unit}
        </Text>
        {settings.showHumidity && (
          <Text style={[styles.detailText, { color: theme.colors.textMuted }]}>
            💧{weather.humidity}%
          </Text>
        )}
        {settings.showWind && (
          <Text style={[styles.detailText, { color: theme.colors.textMuted }]}>
            🌬️{weather.windSpeed}{windUnit}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { fontSize: 44 },
  temp: { fontSize: 38, fontWeight: '200' },
  city: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  desc: { fontSize: 12, textTransform: 'capitalize', marginTop: 2 },
  details: { flexDirection: 'row', gap: 12, paddingTop: 8, borderTopWidth: 1, flexWrap: 'wrap' },
  detailText: { fontSize: 12 },
  errorText: { fontSize: 13, textAlign: 'center', marginBottom: 8 },
  retryBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
});
