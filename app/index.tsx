import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, FONT_SIZE, SUITS } from '../constants/theme';
import { Game, getWinner, getPlayerTotal } from '../utils/gameLogic';
import { getAllGames, deleteGame } from '../utils/storage';
import GameModal from '../components/GameModal';

const monoFont = Platform.select({ ios: 'Menlo', default: 'monospace' });

/* ── Pulsing Live Dot ── */
function PulsingDot() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.liveDot, { opacity: pulse }]} />;
}

/* ── Skeleton Loading Card ── */
function SkeletonCard({ index }: { index: number }) {
  const shimmer = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 0.7, duration: 800, delay: index * 100, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.skeletonCard, { opacity: shimmer }]}>
      <View style={styles.skeletonCircle} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonLine} />
        <View style={styles.skeletonLineShort} />
      </View>
    </Animated.View>
  );
}

/* ── Game Card ── */
function GameCard({
  game,
  index,
  onPress,
  onDelete,
}: {
  game: Game;
  index: number;
  onPress: () => void;
  onDelete: () => void;
}) {
  const winner = getWinner(game);
  const date = new Date(game.createdAt);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const suitsArr = [SUITS.spade, SUITS.heart, SUITS.diamond, SUITS.club];
  const suitColors = [COLORS.suitBlack, COLORS.suitRed, COLORS.suitRed, COLORS.suitBlack];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, [game.id]); // B4: use stable game.id instead of empty deps

  const suitIdx = index % 4;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [12, 0],
          }),
        }],
      }}
    >
      <TouchableOpacity
        style={styles.gameCard}
        onPress={onPress}
        onLongPress={onDelete}
        activeOpacity={0.6}
      >
        <View style={styles.gameCardLeft}>
          <Text style={[styles.cardSuitIcon, { color: suitColors[suitIdx] }]}>
            {suitsArr[suitIdx]}
          </Text>
          <Text style={styles.roundCount}>{game.rounds.length}R</Text>
        </View>
        <View style={styles.gameCardCenter}>
          <Text style={styles.gamePlayers} numberOfLines={1}>
            {game.players.map((p) => p.name).join(' · ')}
          </Text>
          <Text style={styles.scorePreview} numberOfLines={1}>
            {game.players
              .map((p, i) => ({ name: p.name, total: getPlayerTotal(game, i) }))
              .sort((a, b) => a.total - b.total)
              .slice(0, 3)
              .map((p) => `${p.name}: ${p.total}`)
              .join(' · ')}
          </Text>
          <Text style={styles.gameDate}>
            {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            {' · '}
            {(() => {
              const mins = Math.floor((game.updatedAt - game.createdAt) / 60000);
              if (mins < 1) return '<1m';
              if (mins < 60) return `${mins}m`;
              return `${Math.floor(mins / 60)}h${mins % 60}m`;
            })()}
          </Text>
        </View>
        {winner ? (
          <View style={styles.winnerTag}>
            <Text style={styles.winnerCrown}>♛</Text>
            <Text style={styles.winnerName}>{winner.name}</Text>
          </View>
        ) : game.isFinished ? (
          <Text style={styles.endedTag}>ended</Text>
        ) : (
          <PulsingDot />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ── Home Screen ── */
export default function HomeScreen() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGames();
    }, [])
  );

  const loadGames = async () => {
    const allGames = await getAllGames();
    setGames(allGames.reverse());
    setIsLoading(false);
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteGame(deleteTarget);
    setDeleteTarget(null);
    loadGames();
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeIn }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.brandCard}>
              <Text style={styles.brandCardCorner}>A</Text>
              <Text style={styles.brandCardSuit}>♠</Text>
            </View>
            <View>
              <Text style={styles.title}>least count</Text>
              <Text style={styles.subtitle}>score tracker</Text>
            </View>
          </View>
          <View style={styles.suitsRow}>
            <Text style={[styles.suitChar, { color: COLORS.suitBlack }]}>♠</Text>
            <Text style={[styles.suitChar, { color: COLORS.suitRed }]}>♥</Text>
            <Text style={[styles.suitChar, { color: COLORS.suitRed }]}>♦</Text>
            <Text style={[styles.suitChar, { color: COLORS.suitBlack }]}>♣</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={[styles.dividerSuit, { color: COLORS.suitRed }]}>♦</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* New Game */}
        <TouchableOpacity
          style={styles.newGameButton}
          onPress={() => router.push('/setup')}
          activeOpacity={0.6}
        >
          <LinearGradient
            colors={[COLORS.accentGlow, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.newGameGradient}
          >
            <View style={styles.newGameInner}>
              <View style={styles.newGameIcon}>
                <Text style={styles.newGamePlus}>+</Text>
              </View>
              <View>
                <Text style={styles.newGameText}>new game</Text>
                <Text style={styles.newGameHint}>deal the cards</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </LinearGradient>
        </TouchableOpacity>

        {/* History */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionLabel}>
              {SUITS.club} history{games.length > 0 ? ` (${games.length})` : ''}
            </Text>
            <View style={styles.sectionLine} />
          </View>

          {isLoading ? (
            <View style={{ gap: SPACING.xs }}>
              {[0, 1, 2].map((i) => <SkeletonCard key={i} index={i} />)}
            </View>
          ) : games.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.asciiCard}>
                <Text style={[styles.asciiText, { fontFamily: monoFont }]}>┌─────────┐</Text>
                <Text style={[styles.asciiText, { fontFamily: monoFont }]}>│ ♠       │</Text>
                <Text style={[styles.asciiText, { fontFamily: monoFont }]}>│         │</Text>
                <Text style={[styles.asciiText, { fontFamily: monoFont }]}>│    ♠    │</Text>
                <Text style={[styles.asciiText, { fontFamily: monoFont }]}>│         │</Text>
                <Text style={[styles.asciiText, { fontFamily: monoFont }]}>│       ♠ │</Text>
                <Text style={[styles.asciiText, { fontFamily: monoFont }]}>└─────────┘</Text>
              </View>
              <Text style={styles.emptyText}>no games yet</Text>
              <Text style={styles.emptyHint}>tap new game to start</Text>
            </View>
          ) : (
            <FlatList
              data={games}
              renderItem={({ item, index }) => (
                <GameCard
                  game={item}
                  index={index}
                  onPress={() =>
                    router.push({ pathname: '/scorecard', params: { gameId: item.id } })
                  }
                  onDelete={() => handleDelete(item.id)}
                />
              )}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              ListFooterComponent={
                <Text style={styles.deleteHint}>long press to delete</Text>
              }
            />
          )}
        </View>
      </Animated.View>

      <GameModal
        visible={deleteTarget !== null}
        title="delete game"
        message="Remove this game from history? This can't be undone."
        suit="♣"
        actions={[
          { text: 'cancel', onPress: () => setDeleteTarget(null), style: 'cancel' },
          { text: 'delete', onPress: confirmDelete, style: 'destructive' },
        ]}
        onClose={() => setDeleteTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  brandCard: {
    width: 32, height: 44, borderRadius: 4,
    borderWidth: 1, borderColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.accentGlow,
  },
  brandCardCorner: {
    position: 'absolute', top: 3, left: 5,
    fontSize: 8, fontWeight: '700', color: COLORS.accent,
  },
  brandCardSuit: { fontSize: 16, color: COLORS.text, marginTop: 4 },
  title: {
    fontSize: FONT_SIZE.xxl, fontWeight: '300',
    color: COLORS.text, letterSpacing: 3,
  },
  subtitle: {
    fontSize: FONT_SIZE.xs, color: COLORS.textMuted,
    letterSpacing: 4, marginTop: 2,
  },
  suitsRow: { flexDirection: 'row', gap: 6 },
  suitChar: { fontSize: 14 },

  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: SPACING.xxl, marginBottom: SPACING.xl,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerSuit: { fontSize: 10, marginHorizontal: SPACING.md, opacity: 0.5 },

  newGameButton: {
    marginHorizontal: SPACING.xxl, marginBottom: SPACING.xxl,
    borderWidth: 1, borderColor: COLORS.accent + '40',
    borderRadius: RADIUS.md, overflow: 'hidden',
  },
  newGameGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: SPACING.lg, paddingHorizontal: SPACING.lg,
  },
  newGameInner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  newGameIcon: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.accent + '50',
    alignItems: 'center', justifyContent: 'center',
  },
  newGamePlus: { fontSize: 20, color: COLORS.accent, fontWeight: '200' },
  newGameText: { fontSize: FONT_SIZE.md, fontWeight: '500', color: COLORS.text, letterSpacing: 1 },
  newGameHint: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 1 },

  historySection: { flex: 1, paddingHorizontal: SPACING.xxl },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.md, marginBottom: SPACING.lg,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  sectionLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, letterSpacing: 3 },

  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxxl, gap: SPACING.md },
  asciiCard: { marginBottom: SPACING.sm },
  asciiText: { fontSize: 11, color: COLORS.textMuted, lineHeight: 14 },
  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, letterSpacing: 2 },
  emptyHint: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, letterSpacing: 1 },

  gameCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  gameCardLeft: { alignItems: 'center', marginRight: SPACING.md, width: 32 },
  cardSuitIcon: { fontSize: 16 },
  roundCount: { fontSize: 8, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },
  gameCardCenter: { flex: 1 },
  gamePlayers: { fontSize: FONT_SIZE.md, fontWeight: '400', color: COLORS.text },
  gameDate: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  winnerTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.goldGlow, borderWidth: 1, borderColor: COLORS.gold + '30',
  },
  winnerCrown: { fontSize: 10, color: COLORS.gold },
  winnerName: { fontSize: FONT_SIZE.xs, fontWeight: '500', color: COLORS.gold },
  endedTag: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, letterSpacing: 1 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  scorePreview: {
    fontSize: 9, color: COLORS.textMuted,
    marginTop: 1, letterSpacing: 0.5, fontVariant: ['tabular-nums'],
  },
  skeletonCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  skeletonCircle: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.surfaceHighlight, marginRight: SPACING.md,
  },
  skeletonContent: { flex: 1, gap: SPACING.sm },
  skeletonLine: {
    height: 10, borderRadius: 3, backgroundColor: COLORS.surfaceHighlight, width: '80%',
  },
  skeletonLineShort: {
    height: 8, borderRadius: 3, backgroundColor: COLORS.surfaceHighlight, width: '40%',
  },
  deleteHint: {
    fontSize: FONT_SIZE.xs, color: COLORS.textMuted,
    textAlign: 'center', letterSpacing: 2, marginTop: SPACING.lg, opacity: 0.5,
  },
});
