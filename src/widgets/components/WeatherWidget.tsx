import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import { Widget, WeatherData } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';
import { useWidgetRefresh } from '../../engine/RefreshManager';
import { WeatherBackground } from './WeatherBackground';

interface Props { widget: Widget }

const WEATHER_ICONS: Record<string, string> = {
  '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '🌤️',
  '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️', '13d': '🌨️', '13n': '🌨️',
  '50d': '🌫️', '50n': '🌫️',
};

const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY ?? '';

export const WeatherWidget: React.FC<Props> = ({ widget }) => {
  const theme = useTheme();
  const settings = widget.settings as {
    unit?: 'metric' | 'imperial';
    showFeelsLike?: boolean;
    showHumidity?: boolean;
    showWind?: boolean;
  };

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPermissionDenied(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;
      const unit = settings.unit ?? 'metric';

      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=${unit}`
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
  }, [settings.unit]);

  // Fetch immediately on mount
  useEffect(() => { fetchWeather(); }, [fetchWeather]);

  useWidgetRefresh(
    (widget.refreshInterval || 600) * 1000,
    fetchWeather
  );

  const unit = settings.unit === 'imperial' ? '°F' : '°C';
  const windUnit = settings.unit === 'imperial' ? 'mph' : 'm/s';

  if (permissionDenied) {
    return (
      <View style={styles.center}>
        <Text style={[styles.errorText, { color: theme.colors.textMuted }]}>📍 Location access needed</Text>
        <TouchableOpacity onPress={fetchWeather} style={[styles.retryBtn, { backgroundColor: theme.colors.accent }]}>
          <Text style={{ color: theme.colors.onAccent, fontSize: 12 }}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
      <WeatherBackground iconCode={weather.icon} />
      <View style={styles.content}>
        <View style={styles.main}>
          <Text style={styles.icon}>{icon}</Text>
          <View>
            <Text style={[styles.temp, { color: '#fff' }]}>
              {weather.temp}{unit}
            </Text>
            <Text style={[styles.city, { color: 'rgba(255,255,255,0.8)' }]}>{weather.city}</Text>
            <Text style={[styles.desc, { color: 'rgba(255,255,255,0.6)' }]} numberOfLines={1}>
              {weather.description}
            </Text>
          </View>
        </View>
        <View style={[styles.details, { borderTopColor: 'rgba(255,255,255,0.15)' }]}>
          <Text style={[styles.detailText, { color: 'rgba(255,255,255,0.8)' }]}>
            H:{weather.high}{unit} L:{weather.low}{unit}
          </Text>
          {settings.showHumidity && (
            <Text style={[styles.detailText, { color: 'rgba(255,255,255,0.8)' }]}>
              💧{weather.humidity}%
            </Text>
          )}
          {settings.showWind && (
            <Text style={[styles.detailText, { color: 'rgba(255,255,255,0.8)' }]}>
              🌬️{weather.windSpeed}{windUnit}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12 },
  main: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 24 },
  icon: { fontSize: 80 },
  temp: { fontSize: 64, fontWeight: '200' },
  city: { fontSize: 24, fontWeight: '500', marginTop: 4, textAlign: 'center' },
  desc: { fontSize: 18, textTransform: 'capitalize', marginTop: 4, textAlign: 'center' },
  details: { flexDirection: 'row', gap: 20, paddingTop: 16, borderTopWidth: 1, flexWrap: 'wrap', justifyContent: 'center' },
  detailText: { fontSize: 16 },
  errorText: { fontSize: 13, textAlign: 'center', marginBottom: 8 },
  retryBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
});
