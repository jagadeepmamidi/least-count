import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';

interface ToastProps {
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'info', visible, onHide, duration = 2000 }: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => onHide());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'error': return 'alert-circle';
      default: return 'information-circle';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success': return COLORS.gold;
      case 'warning': return COLORS.warning;
      case 'error': return COLORS.danger;
      default: return COLORS.textSecondary;
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }], opacity },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.toast, { borderLeftColor: getColor() }]}>
        <Ionicons name={getIcon()} size={20} color={getColor()} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    marginHorizontal: SPACING.xxl,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  message: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
});
