import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';

interface ModalAction {
  text: string;
  onPress: () => void;
  style?: 'default' | 'destructive' | 'cancel';
}

interface GameModalProps {
  visible: boolean;
  title: string;
  message?: string;
  suit?: string;
  stats?: { label: string; value: string; color?: string }[];
  actions: ModalAction[];
  onClose: () => void;
}

export default function GameModal({
  visible,
  title,
  message,
  suit = '♠',
  stats,
  actions,
  onClose,
}: GameModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.wrapper}>
        <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Card corner suits */}
          <Text style={styles.cornerTopLeft}>{suit}</Text>
          <Text style={styles.cornerBottomRight}>{suit}</Text>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerSuit}>♦</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Message */}
          {message && <Text style={styles.message}>{message}</Text>}

          {/* Stats */}
          {stats && stats.length > 0 && (
            <View style={styles.statsContainer}>
              {stats.map((stat, i) => (
                <View key={i} style={styles.statRow}>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text
                    style={[
                      styles.statValue,
                      stat.color ? { color: stat.color } : undefined,
                    ]}
                  >
                    {stat.value}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {actions.map((action, i) => {
              const isCancel = action.style === 'cancel';
              const isDestructive = action.style === 'destructive';
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.actionBtn,
                    isCancel && styles.cancelBtn,
                    isDestructive && styles.destructiveBtn,
                    !isCancel && !isDestructive && styles.defaultBtn,
                  ]}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.actionText,
                      isCancel && styles.cancelText,
                      isDestructive && styles.destructiveText,
                      !isCancel && !isDestructive && styles.defaultText,
                    ]}
                  >
                    {action.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xxl,
    overflow: 'hidden',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.lg,
    fontSize: 14,
    color: COLORS.textMuted,
    opacity: 0.3,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.lg,
    fontSize: 14,
    color: COLORS.textMuted,
    opacity: 0.3,
    transform: [{ rotate: '180deg' }],
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '300',
    color: COLORS.text,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerSuit: {
    fontSize: 8,
    color: COLORS.suitRed,
    marginHorizontal: SPACING.md,
    opacity: 0.4,
  },
  message: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  statsContainer: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  statValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  cancelBtn: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  destructiveBtn: {
    backgroundColor: COLORS.dangerGlow,
    borderWidth: 1,
    borderColor: COLORS.danger + '40',
  },
  destructiveText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.danger,
    letterSpacing: 1,
  },
  defaultBtn: {
    backgroundColor: COLORS.accent,
  },
  defaultText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.background,
    letterSpacing: 1,
  },
  actionText: {},
});
