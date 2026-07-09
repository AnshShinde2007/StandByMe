import { create } from 'zustand';
import * as Location from 'expo-location';
import axios from 'axios';
import { WeatherData } from '../types';

interface WeatherState {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
  fetchWeather: (unit?: 'metric' | 'imperial') => Promise<void>;
}

const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY ?? '';

export const useWeatherStore = create<WeatherState>((set, get) => ({
  weather: null,
  loading: false,
  error: null,
  permissionDenied: false,

  fetchWeather: async (unit = 'metric') => {
    // Prevent overlapping fetches
    if (get().loading) return;

    set({ loading: true, error: null, permissionDenied: false });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        set({ permissionDenied: true, loading: false });
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;

      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=${unit}`
      );
      const d = res.data;
      
      set({
        weather: {
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
        },
        loading: false,
      });
    } catch (err) {
      console.error('Failed to fetch weather:', err);
      set({ error: 'Failed to fetch weather', loading: false });
    }
  },
}));
