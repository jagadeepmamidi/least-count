import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { hapticImpact } from '../utils/haptics';
import { COLORS, SPACING, RADIUS, FONT_SIZE, SUITS } from '../constants/theme';
import { createGame } from '../utils/gameLogic';
import { saveGame } from '../utils/storage';

const SUIT_CYCLE = [SUITS.spade, SUITS.heart, SUITS.diamond, SUITS.club];
const SUIT_COLORS = [COLORS.suitBlack, COLORS.suitRed, COLORS.suitRed, COLORS.suitBlack];

function PlayerChip({ name, index, onRemove }: {
  name: string;
  index: number;
  onRemove: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const suitIdx = index % 4;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, delay: index * 40, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 100, friction: 12, delay: index * 40, useNativeDriver: true }),
    ]).start();
  }, []);

  const isRedSuit = suitIdx === 1 || suitIdx === 2;
  const suitGlow = isRedSuit ? 'rgba(230,57,70,0.08)' : 'rgba(153,153,153,0.06)';

  return (
    <Animated.View
      style={[styles.playerChip, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      <LinearGradient
        colors={[suitGlow, 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.chipGradient}
      >
        <View style={styles.chipLeft}>
          <Text style={[styles.chipSuit, { color: SUIT_COLORS[suitIdx] }]}>
            {SUIT_CYCLE[suitIdx]}
          </Text>
          <Text style={styles.chipName}>{name}</Text>
        </View>
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.chipRemove}
        >
          <Text style={styles.chipRemoveText}>×</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}

export default function SetupScreen() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState<{ id: number; name: string }[]>([]);
  const inputRef = useRef<TextInput>(null);
  const nextId = useRef(0);

  const addPlayer = () => {
    const name = playerName.trim();
    if (!name) return;
    // C2: Duplicate name check
    if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      return; // silently reject — input stays so user can modify
    }
    setPlayers((prev) => [...prev, { id: nextId.current++, name }]);
    setPlayerName('');
    hapticImpact('Light');
    inputRef.current?.focus();
  };

  const removePlayer = (id: number) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    hapticImpact('Light');
  };

  const startGame = async () => {
    if (players.length < 2) return;
    hapticImpact('Medium');
    Keyboard.dismiss();
    const game = createGame(players.map((p) => p.name));
    await saveGame(game);
    router.replace({ pathname: '/scorecard', params: { gameId: game.id } });
  };

  const isDuplicate = players.some(
    (p) => p.name.toLowerCase() === playerName.trim().toLowerCase()
  ) && playerName.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.6}
        >
          <Ionicons name="arrow-back" size={18} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>new game</Text>
          <Text style={styles.subtitle}>add your players</Text>
        </View>
        <Text style={styles.countBadge}>
          {players.length.toString().padStart(2, '0')}
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={[styles.dividerSuit, { color: COLORS.suitRed }]}>♥</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.inputSection}>
        <View style={styles.inputRow}>
          <View style={[styles.inputWrapper, isDuplicate && styles.inputWrapperDuplicate]}>
            <Text style={styles.inputPrefix}>›</Text>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="player name"
              placeholderTextColor={COLORS.textMuted}
              value={playerName}
              onChangeText={setPlayerName}
              onSubmitEditing={addPlayer}
              returnKeyType="done"
              maxLength={20}
            />
          </View>
          <TouchableOpacity
            style={[styles.addButton, (!playerName.trim() || isDuplicate) && styles.addButtonDisabled]}
            onPress={addPlayer}
            disabled={!playerName.trim() || isDuplicate}
            activeOpacity={0.6}
          >
            <Text style={[styles.addText, (!playerName.trim() || isDuplicate) && styles.addTextDisabled]}>add</Text>
          </TouchableOpacity>
        </View>
        {isDuplicate && (
          <Text style={styles.duplicateHint}>name already taken</Text>
        )}
      </View>

      {/* Players list */}
      <ScrollView
        style={styles.playersList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.playersListContent}
      >
        {players.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyCards}>
              <Text style={styles.emptyCardText}>┌───┐ ┌───┐</Text>
              <Text style={styles.emptyCardText}>│ ♠ │ │ ♥ │</Text>
              <Text style={styles.emptyCardText}>└───┘ └───┘</Text>
            </View>
            <Text style={styles.emptyText}>add at least 2 players</Text>
          </View>
        ) : (
          <>
            <View style={styles.listHeader}>
              <View style={styles.sectionLine} />
              <Text style={styles.listLabel}>{SUITS.spade} players</Text>
              <View style={styles.sectionLine} />
            </View>
            {players.map((player, index) => (
              <PlayerChip
                key={player.id}
                name={player.name}
                index={index}
                onRemove={() => removePlayer(player.id)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Start button — fixed at bottom, always visible */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          onPress={startGame}
          disabled={players.length < 2}
          activeOpacity={0.6}
        >
          {players.length >= 2 ? (
            <LinearGradient
              colors={[COLORS.accent, COLORS.gold]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startGradient}
            >
              <Text style={styles.startText}>deal & start</Text>
              <Text style={styles.startSuit}>♠</Text>
            </LinearGradient>
          ) : (
            <View style={styles.startDisabledInner}>
              <Text style={[styles.startText, styles.startTextDisabled]}>need more players</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.lg,
  },
  backButton: {
    width: 36, height: 36,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, paddingHorizontal: SPACING.lg },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '300',
    color: COLORS.text,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginTop: 2,
  },
  countBadge: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '200',
    color: COLORS.accent,
    fontVariant: ['tabular-nums'],
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.xxl,
    marginBottom: SPACING.xl,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerSuit: { fontSize: 10, marginHorizontal: SPACING.md, opacity: 0.5 },

  inputSection: { paddingHorizontal: SPACING.xxl, marginBottom: SPACING.xl },
  inputRow: { flexDirection: 'row', gap: SPACING.sm },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  inputWrapperDuplicate: {
    borderColor: COLORS.warning,
  },
  duplicateHint: {
    fontSize: FONT_SIZE.xs, color: COLORS.warning,
    letterSpacing: 1, marginTop: SPACING.xs, paddingLeft: SPACING.xs,
  },
  inputPrefix: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.accent,
    marginRight: SPACING.sm,
    fontWeight: '300',
  },
  input: {
    flex: 1, height: 44,
    fontSize: FONT_SIZE.md, color: COLORS.text,
    letterSpacing: 0.5,
  },
  addButton: {
    paddingHorizontal: SPACING.xl,
    height: 44,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.accent + '50',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.accentGlow,
  },
  addButtonDisabled: { borderColor: COLORS.border, backgroundColor: 'transparent' },
  addText: { fontSize: FONT_SIZE.sm, fontWeight: '500', color: COLORS.accent, letterSpacing: 1 },
  addTextDisabled: { color: COLORS.textMuted },

  playersList: { flex: 1, paddingHorizontal: SPACING.xxl },

  listHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.md, marginBottom: SPACING.md,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  listLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, letterSpacing: 3 },

  emptyState: {
    alignItems: 'center', paddingVertical: SPACING.huge, gap: SPACING.md,
  },
  emptyCards: { marginBottom: SPACING.xs },
  emptyCardText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 15,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm, color: COLORS.textMuted, letterSpacing: 2,
  },

  playerChip: {
    marginBottom: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden',
  },
  chipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  chipLeft: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
  },
  chipSuit: { fontSize: 16 },
  chipName: {
    fontSize: FONT_SIZE.md, fontWeight: '400',
    color: COLORS.text, letterSpacing: 0.5,
  },
  chipRemove: {
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
  },
  chipRemoveText: { fontSize: 18, color: COLORS.textMuted, fontWeight: '300' },

  bottomSection: {
    paddingHorizontal: SPACING.xxl,
    paddingBottom: 36, paddingTop: SPACING.lg,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  startGradient: {
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.sm,
  },
  startDisabledInner: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
  },
  startText: {
    fontSize: FONT_SIZE.md, fontWeight: '600',
    color: COLORS.background, letterSpacing: 2,
  },
  startTextDisabled: { color: COLORS.textMuted },
  startSuit: { fontSize: 14, color: COLORS.background },
});
