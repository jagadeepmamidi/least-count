import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PARTICLE_COUNT = 40;
const CONFETTI_COLORS = [
  '#d4a574', '#e63946', '#e8dcc8', '#fbbf24',
  '#c4b9a8', '#ff6b6b', '#f5f0e8', '#e6a23c',
];

function ConfettiParticle({ index, onFinish }: { index: number; onFinish?: () => void }) {
  const fallAnim = useRef(new Animated.Value(0)).current;
  const startX = Math.random() * SCREEN_WIDTH;
  const drift = (Math.random() - 0.5) * 120;
  const size = Math.random() * 8 + 4;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const duration = 2500 + Math.random() * 1500;
  const delay = Math.random() * 600;

  useEffect(() => {
    Animated.timing(fallAnim, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      if (onFinish) onFinish();
    });
  }, []);

  const translateY = fallAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, SCREEN_HEIGHT + 20],
  });

  const translateX = fallAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, drift, drift * 0.5],
  });

  const opacity = fallAnim.interpolate({
    inputRange: [0, 0.1, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });

  const rotate = fallAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${Math.random() * 720}deg`],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          width: size,
          height: size * 1.5,
          backgroundColor: color,
          opacity,
          transform: [{ translateY }, { translateX }, { rotate }],
        },
      ]}
    />
  );
}

interface ConfettiProps {
  visible: boolean;
  onComplete?: () => void;
}

export default function Confetti({ visible, onComplete }: ConfettiProps) {
  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: PARTICLE_COUNT }).map((_, index) => (
        <ConfettiParticle
          key={index}
          index={index}
          onFinish={index === 0 ? onComplete : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  particle: {
    position: 'absolute',
    borderRadius: 2,
    top: 0,
  },
});
