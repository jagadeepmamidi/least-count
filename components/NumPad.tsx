import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { hapticImpact } from '../utils/haptics';
import { COLORS, SPACING, RADIUS, FONT_SIZE, SUITS, ELIMINATION_THRESHOLD, WARNING_THRESHOLD } from '../constants/theme';

interface NumPadProps {
  visible: boolean;
  playerName: string;
  currentTotal: number;
  onSubmit: (value: number) => void;
  onClose: () => void;
}

export default function NumPad({
  visible,
  playerName,
  currentTotal,
  onSubmit,
  onClose,
}: NumPadProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setValue('');
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleSubmit = () => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;
    hapticImpact('Medium');
    onSubmit(numValue);
    setValue('');
  };

  const handleClose = () => {
    setValue('');
    onClose();
  };

  const numValue = parseInt(value, 10) || 0;
  const previewTotal = currentTotal + numValue;
  const isDanger = previewTotal >= ELIMINATION_THRESHOLD;
  const isWarn = previewTotal >= WARNING_THRESHOLD && previewTotal < ELIMINATION_THRESHOLD;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose} statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
          <Animated.View style={[styles.overlayBg, { opacity: overlayAnim }]} />
        </TouchableOpacity>

        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Player Info */}
          <View style={styles.playerRow}>
            <View style={styles.playerInfo}>
              <Text style={styles.playerSuit}>♠</Text>
              <Text style={styles.playerName}>{playerName}</Text>
            </View>
            <View style={styles.totalInfo}>
              <Text style={styles.totalLabel}>current</Text>
              <Text style={styles.totalValue}>{currentTotal}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerSuit}>♦</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Score Input */}
          <View style={[
            styles.inputContainer,
            isDanger && styles.inputDanger,
            isWarn && styles.inputWarning,
          ]}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={value}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '');
                if (parseInt(cleaned, 10) <= 999 || cleaned === '') {
                  setValue(cleaned);
                }
              }}
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              maxLength={3}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              selectionColor={COLORS.accent}
            />
            {value !== '' && (
              <View style={styles.previewRow}>
                <Text style={[
                  styles.previewText,
                  isDanger && styles.previewDanger,
                  isWarn && styles.previewWarning,
                ]}>
                  → {previewTotal}
                </Text>
                {isDanger && (
                  <View style={styles.elimBadge}>
                    <Text style={styles.elimText}>OUT</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.zeroButton}
              onPress={() => { hapticImpact('Light'); onSubmit(0); setValue(''); }}
              activeOpacity={0.7}
            >
              <Text style={styles.zeroText}>0 ♛</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, !value && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={!value}
              activeOpacity={0.8}
            >
              <Text style={[styles.submitText, !value && styles.submitTextDisabled]}>
                submit ♠
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, justifyContent: 'flex-end' },
  overlay: { flex: 1 },
  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.overlay },
  container: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal: SPACING.xxl,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: COLORS.textMuted,
    alignSelf: 'center',
    marginTop: SPACING.md, marginBottom: SPACING.lg,
  },

  // Player Row
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  playerInfo: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
  },
  playerSuit: { fontSize: 16, color: COLORS.suitBlack },
  playerName: {
    fontSize: FONT_SIZE.lg, fontWeight: '500',
    color: COLORS.text, letterSpacing: 1,
  },
  totalInfo: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
  },
  totalLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, letterSpacing: 1 },
  totalValue: {
    fontSize: FONT_SIZE.xl, fontWeight: '200',
    color: COLORS.textSecondary, fontVariant: ['tabular-nums'],
  },

  // Divider
  dividerRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerSuit: {
    fontSize: 8, color: COLORS.suitRed,
    marginHorizontal: SPACING.md, opacity: 0.4,
  },

  // Input
  inputContainer: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  inputDanger: { borderColor: COLORS.danger, backgroundColor: COLORS.dangerGlow },
  inputWarning: { borderColor: COLORS.warning, backgroundColor: COLORS.warningGlow },
  input: {
    fontSize: 48, fontWeight: '300',
    color: COLORS.text, textAlign: 'center',
    width: '100%', paddingVertical: SPACING.xs,
    letterSpacing: 8,
  },
  previewRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.sm, paddingTop: SPACING.xs,
  },
  previewText: {
    fontSize: FONT_SIZE.sm, fontWeight: '500',
    color: COLORS.textSecondary, letterSpacing: 1,
  },
  previewDanger: { color: COLORS.danger },
  previewWarning: { color: COLORS.warning },
  elimBadge: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3,
  },
  elimText: {
    fontSize: 8, fontWeight: '800',
    color: COLORS.white, letterSpacing: 1,
  },

  // Actions
  actions: { flexDirection: 'row', gap: SPACING.md },
  cancelButton: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cancelText: {
    fontSize: FONT_SIZE.sm, fontWeight: '500',
    color: COLORS.textSecondary, letterSpacing: 1,
  },
  zeroButton: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.successGlow,
    borderWidth: 1, borderColor: COLORS.success + '30',
  },
  zeroText: {
    fontSize: FONT_SIZE.sm, fontWeight: '600',
    color: COLORS.success, letterSpacing: 1,
  },
  submitButton: {
    flex: 2, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm, paddingVertical: SPACING.md,
  },
  submitDisabled: { backgroundColor: COLORS.surfaceLight },
  submitText: {
    fontSize: FONT_SIZE.sm, fontWeight: '600',
    color: COLORS.background, letterSpacing: 1,
  },
  submitTextDisabled: { color: COLORS.textMuted },
});
