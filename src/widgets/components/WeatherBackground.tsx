import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, AccessibilityInfo } from 'react-native';
import Svg, { LinearGradient, Stop, Rect } from 'react-native-svg';

// --- Configuration & Helpers ---

const USE_NATIVE_DRIVER = true;

const createLoop = (animValue: Animated.Value, toValue: number, duration: number, easing = Easing.linear) => {
  animValue.setValue(0);
  return Animated.loop(
    Animated.timing(animValue, {
      toValue,
      duration,
      easing,
      useNativeDriver: USE_NATIVE_DRIVER,
    })
  );
};

const createPulse = (animValue: Animated.Value, duration: number) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animValue, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(animValue, { toValue: 0.3, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: USE_NATIVE_DRIVER }),
    ])
  );
};

// --- Background Components ---

const ClearDayFx = () => {
  const orbs = useRef(Array.from({ length: 5 }).map(() => ({
    opacity: new Animated.Value(Math.random() * 0.5 + 0.2),
    translateY: new Animated.Value(0),
    x: Math.random() * 100,
    size: Math.random() * 40 + 20,
    duration: Math.random() * 10000 + 20000,
  }))).current;

  useEffect(() => {
    const animations = orbs.map(orb => {
      orb.translateY.setValue(0);
      return Animated.loop(
        Animated.sequence([
          Animated.timing(orb.translateY, { toValue: -50, duration: orb.duration / 2, easing: Easing.inOut(Easing.sine), useNativeDriver: USE_NATIVE_DRIVER }),
          Animated.timing(orb.translateY, { toValue: 0, duration: orb.duration / 2, easing: Easing.inOut(Easing.sine), useNativeDriver: USE_NATIVE_DRIVER }),
        ])
      );
    });
    Animated.parallel(animations).start();
    return () => animations.forEach(a => a.stop());
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {orbs.map((orb, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: `${orb.x}%`,
            top: `${50 + (Math.random() * 40 - 20)}%`,
            width: orb.size,
            height: orb.size,
            borderRadius: orb.size / 2,
            backgroundColor: 'rgba(255,255,255,0.15)',
            opacity: orb.opacity,
            transform: [{ translateY: orb.translateY }],
          }}
        />
      ))}
    </View>
  );
};

const ClearNightFx = () => {
  const stars = useRef(Array.from({ length: 15 }).map(() => ({
    opacity: new Animated.Value(0),
    x: Math.random() * 100,
    y: Math.random() * 80,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 2000 + 2000,
    delay: Math.random() * 2000,
  }))).current;

  useEffect(() => {
    const animations = stars.map(star => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(star.delay),
          Animated.timing(star.opacity, { toValue: Math.random() * 0.6 + 0.2, duration: star.duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: USE_NATIVE_DRIVER }),
          Animated.timing(star.opacity, { toValue: 0, duration: star.duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: USE_NATIVE_DRIVER }),
        ])
      );
    });
    Animated.parallel(animations).start();
    return () => animations.forEach(a => a.stop());
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {stars.map((star, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            borderRadius: star.size / 2,
            backgroundColor: '#fff',
            opacity: star.opacity,
          }}
        />
      ))}
    </View>
  );
};

const CloudyFx = () => {
  const clouds = useRef(Array.from({ length: 3 }).map((_, i) => ({
    translateX: new Animated.Value(0),
    y: Math.random() * 40 + (i * 15),
    size: Math.random() * 60 + 80,
    duration: Math.random() * 15000 + 30000,
    opacity: Math.random() * 0.2 + 0.1,
  }))).current;

  useEffect(() => {
    const animations = clouds.map(cloud => {
      cloud.translateX.setValue(-150);
      return Animated.loop(
        Animated.timing(cloud.translateX, {
          toValue: 300,
          duration: cloud.duration,
          easing: Easing.linear,
          useNativeDriver: USE_NATIVE_DRIVER,
        })
      );
    });
    Animated.parallel(animations).start();
    return () => animations.forEach(a => a.stop());
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {clouds.map((cloud, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            top: `${cloud.y}%`,
            left: 0,
            width: cloud.size,
            height: cloud.size * 0.6,
            borderRadius: cloud.size / 2,
            backgroundColor: 'rgba(255,255,255,1)',
            opacity: cloud.opacity,
            transform: [{ translateX: cloud.translateX }],
          }}
        />
      ))}
    </View>
  );
};

const RainFx = () => {
  const streaks = useRef(Array.from({ length: 15 }).map(() => ({
    translateY: new Animated.Value(0),
    x: Math.random() * 100,
    duration: Math.random() * 400 + 800,
    delay: Math.random() * 1000,
    height: Math.random() * 20 + 10,
    opacity: Math.random() * 0.3 + 0.1,
  }))).current;

  useEffect(() => {
    const animations = streaks.map(streak => {
      streak.translateY.setValue(-50);
      return Animated.loop(
        Animated.sequence([
          Animated.delay(streak.delay),
          Animated.timing(streak.translateY, {
            toValue: 300,
            duration: streak.duration,
            easing: Easing.linear,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ])
      );
    });
    Animated.parallel(animations).start();
    return () => animations.forEach(a => a.stop());
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {streaks.map((streak, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: `${streak.x}%`,
            top: -20,
            width: 1.5,
            height: streak.height,
            backgroundColor: 'rgba(255,255,255,1)',
            opacity: streak.opacity,
            transform: [
              { translateY: streak.translateY },
              { rotate: '15deg' }
            ],
          }}
        />
      ))}
    </View>
  );
};

const LightningFx = () => {
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const triggerFlash = () => {
      Animated.sequence([
        Animated.timing(flash, { toValue: 0.8, duration: 50, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(flash, { toValue: 0, duration: 100, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(flash, { toValue: 0.5, duration: 50, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(flash, { toValue: 0, duration: 200, useNativeDriver: USE_NATIVE_DRIVER }),
      ]).start(() => {
        timeout = setTimeout(triggerFlash, Math.random() * 7000 + 8000); // 8-15s
      });
    };

    timeout = setTimeout(triggerFlash, Math.random() * 5000 + 2000);

    return () => {
      clearTimeout(timeout);
      flash.stopAnimation();
    };
  }, []);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: '#fff', opacity: flash }
      ]}
    />
  );
};

const StormFx = () => (
  <View style={StyleSheet.absoluteFill}>
    <RainFx />
    <LightningFx />
  </View>
);

const SnowFx = () => {
  const flakes = useRef(Array.from({ length: 12 }).map(() => ({
    translateY: new Animated.Value(0),
    translateX: new Animated.Value(0),
    x: Math.random() * 100,
    size: Math.random() * 4 + 2,
    durationY: Math.random() * 4000 + 6000,
    durationX: Math.random() * 3000 + 3000,
    delay: Math.random() * 4000,
    opacity: Math.random() * 0.5 + 0.3,
  }))).current;

  useEffect(() => {
    const animations = flakes.map(flake => {
      flake.translateY.setValue(-20);
      flake.translateX.setValue(0);
      
      const moveY = Animated.loop(
        Animated.sequence([
          Animated.delay(flake.delay),
          Animated.timing(flake.translateY, {
            toValue: 300,
            duration: flake.durationY,
            easing: Easing.linear,
            useNativeDriver: USE_NATIVE_DRIVER,
          })
        ])
      );

      const driftX = Animated.loop(
        Animated.sequence([
          Animated.timing(flake.translateX, { toValue: 15, duration: flake.durationX / 2, easing: Easing.inOut(Easing.sine), useNativeDriver: USE_NATIVE_DRIVER }),
          Animated.timing(flake.translateX, { toValue: -15, duration: flake.durationX, easing: Easing.inOut(Easing.sine), useNativeDriver: USE_NATIVE_DRIVER }),
          Animated.timing(flake.translateX, { toValue: 0, duration: flake.durationX / 2, easing: Easing.inOut(Easing.sine), useNativeDriver: USE_NATIVE_DRIVER }),
        ])
      );

      return Animated.parallel([moveY, driftX]);
    });

    Animated.parallel(animations).start();
    return () => animations.forEach(a => a.stop());
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {flakes.map((flake, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: `${flake.x}%`,
            top: -10,
            width: flake.size,
            height: flake.size,
            borderRadius: flake.size / 2,
            backgroundColor: '#fff',
            opacity: flake.opacity,
            transform: [
              { translateY: flake.translateY },
              { translateX: flake.translateX }
            ],
          }}
        />
      ))}
    </View>
  );
};

const FogFx = () => {
  const layers = useRef(Array.from({ length: 2 }).map((_, i) => ({
    translateX: new Animated.Value(0),
    duration: i === 0 ? 25000 : 35000,
    opacity: i === 0 ? 0.4 : 0.2,
  }))).current;

  useEffect(() => {
    const animations = layers.map((layer, i) => {
      layer.translateX.setValue(i === 0 ? -20 : 20);
      return Animated.loop(
        Animated.sequence([
          Animated.timing(layer.translateX, { toValue: i === 0 ? 20 : -20, duration: layer.duration / 2, easing: Easing.inOut(Easing.sine), useNativeDriver: USE_NATIVE_DRIVER }),
          Animated.timing(layer.translateX, { toValue: i === 0 ? -20 : 20, duration: layer.duration / 2, easing: Easing.inOut(Easing.sine), useNativeDriver: USE_NATIVE_DRIVER }),
        ])
      );
    });
    Animated.parallel(animations).start();
    return () => animations.forEach(a => a.stop());
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {layers.map((layer, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            top: '20%',
            left: '-20%',
            width: '140%',
            height: '100%',
            backgroundColor: 'rgba(255,255,255,0.1)',
            opacity: layer.opacity,
            transform: [{ translateX: layer.translateX }],
          }}
        />
      ))}
    </View>
  );
};

const TwilightFx = () => {
  const opacity = useRef(new Animated.Value(0.1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 4000, easing: Easing.inOut(Easing.sine), useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(opacity, { toValue: 0.1, duration: 4000, easing: Easing.inOut(Easing.sine), useNativeDriver: USE_NATIVE_DRIVER }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: '#fbbf24', opacity }
      ]}
    />
  );
};

// --- Main Background Coordinator ---

type ConditionCode = string; // e.g., '01d', '09n'

interface Props {
  iconCode?: ConditionCode;
}

const GRADIENTS: Record<string, [string, string]> = {
  '01d': ['#4a90e2', '#50e3c2'], // clear day
  '01n': ['#0b1021', '#1b2a47'], // clear night
  '02d': ['#4a90e2', '#50e3c2'], // few clouds day
  '02n': ['#0b1021', '#1b2a47'], // few clouds night
  '03d': ['#7b8a97', '#a8b5c2'], // cloudy day
  '03n': ['#1c2331', '#2d3748'], // cloudy night
  '04d': ['#7b8a97', '#a8b5c2'], // overcast day
  '04n': ['#1c2331', '#2d3748'], // overcast night
  '09d': ['#4b5563', '#6b7280'], // shower rain day
  '09n': ['#111827', '#374151'], // shower rain night
  '10d': ['#4b5563', '#6b7280'], // rain day
  '10n': ['#111827', '#374151'], // rain night
  '11d': ['#1f2937', '#111827'], // storm day
  '11n': ['#1f2937', '#111827'], // storm night
  '13d': ['#9ca3af', '#e5e7eb'], // snow day
  '13n': ['#374151', '#9ca3af'], // snow night
  '50d': ['#9ca3af', '#d1d5db'], // mist/fog day
  '50n': ['#4b5563', '#9ca3af'], // mist/fog night
};

export const WeatherBackground: React.FC<Props> = ({ iconCode = '01d' }) => {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const gradientColors = GRADIENTS[iconCode] || GRADIENTS['01d'];
  const isNight = iconCode.endsWith('n');
  const codePrefix = iconCode.substring(0, 2);

  const hour = new Date().getHours();
  const isTwilight = !isNight && (codePrefix === '01' || codePrefix === '02') && ((hour >= 5 && hour <= 7) || (hour >= 17 && hour <= 19));

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill}>
        <LinearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={gradientColors[0]} />
          <Stop offset="100%" stopColor={gradientColors[1]} />
        </LinearGradient>
        <Rect width="100%" height="100%" fill="url(#bg)" />
      </Svg>

      {!reduceMotion && (
        <View style={StyleSheet.absoluteFill}>
          {(codePrefix === '01' || codePrefix === '02') && !isNight && <ClearDayFx />}
          {(codePrefix === '01' || codePrefix === '02') && isNight && <ClearNightFx />}
          {(codePrefix === '03' || codePrefix === '04') && <CloudyFx />}
          {(codePrefix === '09' || codePrefix === '10') && <RainFx />}
          {codePrefix === '11' && <StormFx />}
          {codePrefix === '13' && <SnowFx />}
          {codePrefix === '50' && <FogFx />}
          {isTwilight && <TwilightFx />}
        </View>
      )}

      {/* Dark overlay for contrast */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.22)' }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 24, // Assuming widget rounding
  },
});
