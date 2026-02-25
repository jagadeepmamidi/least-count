import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { hapticImpact, hapticNotification } from '../utils/haptics';
import {
  COLORS, SPACING, RADIUS, FONT_SIZE, SUITS,
  ELIMINATION_THRESHOLD, WARNING_THRESHOLD,
} from '../constants/theme';
import {
  Game, addRound, setScore, undoLastScore, getPlayerTotal,
  isEliminated, isWarning, getActivePlayers, getWinner, isRoundComplete,
  SCORE_NOT_ENTERED,
} from '../utils/gameLogic';
import { loadCurrentGame, saveGame, getAllGames } from '../utils/storage';
import NumPad from '../components/NumPad';
import Toast from '../components/Toast';
import Confetti from '../components/Confetti';
import GameModal from '../components/GameModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_BAR_HEIGHT = 80;
const LABEL_WIDTH = 48;
const MIN_CELL_WIDTH = 72;

// Card suit colors for player columns
const SUIT_CYCLE = [SUITS.spade, SUITS.heart, SUITS.diamond, SUITS.club];
const SUIT_COLORS_MAP = [COLORS.suitBlack, COLORS.suitRed, COLORS.suitRed, COLORS.suitBlack];

/* ── Animated Score Cell ── */
function ScoreCell({
  score,
  eliminated,
  onPress,
  disabled,
  cellWidth,
  rowHeight,
}: {
  score: number;
  eliminated: boolean;
  onPress: () => void;
  disabled: boolean;
  cellWidth: number;
  rowHeight: number;
}) {
  const flipAnim = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const prevScore = useRef(score);
  const cellHasValue = score !== SCORE_NOT_ENTERED;

  useEffect(() => {
    if (score !== prevScore.current && cellHasValue) {
      // Card-flip effect (scaleX squeeze)
      Animated.sequence([
        Animated.timing(flipAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
        Animated.spring(flipAnim, { toValue: 1, tension: 180, friction: 12, useNativeDriver: true }),
      ]).start();
      // Zero-score green flash celebration
      if (score === 0) {
        glowOpacity.setValue(0.35);
        Animated.timing(glowOpacity, { toValue: 0, duration: 900, useNativeDriver: true }).start();
      }
    }
    prevScore.current = score;
  }, [score]);

  return (
    <TouchableOpacity
      style={[
        styles.cell,
        { width: cellWidth, height: rowHeight },
        eliminated && styles.cellEliminated,
        cellHasValue && styles.cellFilled,
      ]}
      onPress={onPress}
      activeOpacity={eliminated ? 1 : 0.6}
      disabled={disabled}
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.success, opacity: glowOpacity, borderRadius: 2 }]}
        pointerEvents="none"
      />
      <Animated.Text
        style={[
          styles.cellText,
          eliminated && styles.cellTextEliminated,
          score === 0 && styles.cellTextZero,
          { transform: [{ scaleX: flipAnim }] },
        ]}
      >
        {cellHasValue ? score.toString() : '—'}
      </Animated.Text>
    </TouchableOpacity>
  );
}

export default function ScorecardScreen() {
  const router = useRouter();
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [numPadVisible, setNumPadVisible] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    roundIndex: number;
    playerIndex: number;
  } | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
    visible: boolean;
  }>({ message: '', type: 'info', visible: false });
  const [showConfetti, setShowConfetti] = useState(false);
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const verticalScrollRef = useRef<ScrollView>(null);
  const horizontalScrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bannerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadGame();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [gameId]);

  const loadGame = useCallback(async () => {
    try {
      const allGames = await getAllGames();
      const found = allGames.find((g) => g.id === gameId);
      if (found) {
        setGame(found);
        if (found.isFinished && found.winnerId) bannerAnim.setValue(1);
        return;
      }
      const current = await loadCurrentGame();
      if (current) {
        setGame(current);
        if (current.isFinished && current.winnerId) bannerAnim.setValue(1);
        return;
      }
      setLoadError(true);
    } catch {
      setLoadError(true);
    }
  }, [gameId]);

  const updateGame = useCallback(async (newGame: Game) => {
    setGame(newGame);
    await saveGame(newGame);
  }, []);

  const findNextEmptyCell = useCallback(
    (currentGame: Game, afterRound: number, afterPlayer: number) => {
      const lastRound = currentGame.rounds.length - 1;
      // Try remaining players in same round
      for (let p = afterPlayer + 1; p < currentGame.players.length; p++) {
        if (
          currentGame.rounds[afterRound][p] === SCORE_NOT_ENTERED &&
          !isEliminated(currentGame, p)
        ) {
          return { roundIndex: afterRound, playerIndex: p };
        }
      }
      // If round is complete, check if we need a new round
      if (isRoundComplete(currentGame, afterRound) && afterRound === lastRound) {
        return null; // signal to auto-add round
      }
      return undefined; // no auto-advance
    },
    []
  );

  const handleCellPress = useCallback(
    (roundIndex: number, playerIndex: number) => {
      if (!game) return;
      if (isEliminated(game, playerIndex)) {
        showToastMsg('Player is eliminated', 'error');
        return;
      }
      setSelectedCell({ roundIndex, playerIndex });
      setNumPadVisible(true);
    },
    [game]
  );

  const handleScoreSubmit = useCallback(
    async (value: number) => {
      if (!game || !selectedCell) return;

      let newGame = setScore(
        game,
        selectedCell.roundIndex,
        selectedCell.playerIndex,
        value
      );

      const playerName = game.players[selectedCell.playerIndex].name;
      const newTotal = getPlayerTotal(newGame, selectedCell.playerIndex);

      if (isEliminated(newGame, selectedCell.playerIndex)) {
        hapticNotification('Error');
        showToastMsg(`${playerName} eliminated at ${newTotal}!`, 'error');
      } else if (isWarning(newGame, selectedCell.playerIndex)) {
        hapticNotification('Warning');
        showToastMsg(`${playerName} at ${newTotal} — danger zone!`, 'warning');
      }

      const winner = getWinner(newGame);
      if (winner) {
        setShowConfetti(true);
        hapticNotification('Success');
        Animated.spring(bannerAnim, {
          toValue: 1,
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        }).start();
        setTimeout(() => {
          showToastMsg(`${winner.name} wins the game!`, 'success');
        }, 500);
        setTimeout(() => setShowConfetti(false), 4000);
        await updateGame(newGame);
        setNumPadVisible(false);
        setSelectedCell(null);
        return;
      }

      // B3: Auto-add round when current round is complete
      const lastRoundIdx = newGame.rounds.length - 1;
      if (
        !newGame.isFinished &&
        isRoundComplete(newGame, selectedCell.roundIndex) &&
        selectedCell.roundIndex === lastRoundIdx
      ) {
        newGame = addRound(newGame);
        hapticImpact('Light');
        await updateGame(newGame);
        setNumPadVisible(false);
        setSelectedCell(null);
        setTimeout(() => {
          verticalScrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
        return;
      }

      // UX: Auto-advance to next empty cell in current round
      const nextCell = findNextEmptyCell(
        newGame,
        selectedCell.roundIndex,
        selectedCell.playerIndex
      );

      await updateGame(newGame);

      if (nextCell) {
        setSelectedCell(nextCell);
        // keep numpad open for next player
      } else {
        setNumPadVisible(false);
        setSelectedCell(null);
      }
    },
    [game, selectedCell, bannerAnim, updateGame, findNextEmptyCell]
  );

  const handleAddRound = useCallback(async () => {
    if (!game) return;
    hapticImpact('Light');
    const newGame = addRound(game);
    await updateGame(newGame);
    setTimeout(() => {
      verticalScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [game, updateGame]);

  const handleUndo = useCallback(async () => {
    if (!game || !game.lastAction) return;
    hapticImpact('Medium');
    const newGame = undoLastScore(game);
    await updateGame(newGame);
    showToastMsg('Score undone', 'info');
  }, [game, updateGame]);

  const handleEndGame = useCallback(() => {
    if (!game) return;
    if (!game.isFinished) {
      setShowEndGameModal(true);
    } else {
      router.replace('/');
    }
  }, [game, router]);

  const showToastMsg = (message: string, type: 'success' | 'warning' | 'error' | 'info') => {
    setToast({ message, type, visible: true });
  };

  // B1: Error state when game can't be loaded
  if (loadError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorIcon}>♠</Text>
        <Text style={styles.errorText}>Game not found</Text>
        <TouchableOpacity
          style={styles.errorBtn}
          onPress={() => router.replace('/')}
          activeOpacity={0.7}
        >
          <Text style={styles.errorBtnText}>go home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const winner = getWinner(game);
  const playerCount = game.players.length;
  // Horizontal scroll: use MIN_CELL_WIDTH if players overflow screen
  const naturalCellWidth = Math.floor((SCREEN_WIDTH - LABEL_WIDTH) / playerCount);
  const cellWidth = Math.max(MIN_CELL_WIDTH, naturalCellWidth);
  const needsHorizontalScroll = cellWidth * playerCount + LABEL_WIDTH > SCREEN_WIDTH;
  const rowHeight = Math.max(44, Math.min(56, SCREEN_HEIGHT / 14));
  const isViewOnly = game.isFinished;

  // Player rankings (lower total = better, non-eliminated only)
  const playerRanks: Record<number, number> = {};
  const activeTotals = game.players
    .map((_, i) => ({ index: i, total: getPlayerTotal(game, i), elim: isEliminated(game, i) }))
    .filter((p) => !p.elim)
    .sort((a, b) => a.total - b.total);
  activeTotals.forEach((p, rank) => { playerRanks[p.index] = rank + 1; });

  const getFormattedDuration = () => {
    const ms = game.updatedAt - game.createdAt;
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return '<1 min';
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const getLeaderName = () => {
    if (activeTotals.length === 0) return '—';
    const leader = activeTotals[0];
    return `${game.players[leader.index].name} (${leader.total})`;
  };

  // Round totals per row
  const getRoundTotal = (roundIndex: number) => {
    return game.rounds[roundIndex].reduce((sum, s) => sum + (s > 0 ? s : 0), 0);
  };

  const renderTableContent = () => (
    <View>
      {/* Player Names Header (sticky via stickyHeaderIndices on parent) */}
      <View style={styles.tableHeader}>
        <View style={[styles.roundLabel, { height: rowHeight }]}>
          <Text style={styles.roundLabelText}>#</Text>
        </View>
        {game.players.map((player, index) => {
          const eliminated = isEliminated(game, index);
          const suitIdx = index % 4;
          return (
            <View
              key={player.id}
              style={[
                styles.headerCell,
                { width: cellWidth, height: rowHeight },
                eliminated && styles.headerCellEliminated,
              ]}
            >
              <Text style={[styles.headerSuit, { color: SUIT_COLORS_MAP[suitIdx] }]}>
                {SUIT_CYCLE[suitIdx]}
              </Text>
              <Text
                style={[styles.headerName, eliminated && styles.headerNameEliminated]}
                numberOfLines={1}
              >
                {player.name}
              </Text>
            </View>
          );
        })}
        {/* Gradient accent line */}
        <LinearGradient
          colors={[COLORS.accent + '00', COLORS.accent + '30', COLORS.accent + '00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradientLine}
        />
      </View>

      {/* Score Rows */}
      {game.rounds.map((round, roundIndex) => (
        <View key={roundIndex} style={styles.tableRow}>
          <View style={[styles.roundLabel, { height: rowHeight }]}>
            <Text style={styles.roundNumber}>{roundIndex + 1}</Text>
          </View>
          {round.map((score, playerIndex) => {
            const eliminated = isEliminated(game, playerIndex);
            return (
              <ScoreCell
                key={playerIndex}
                score={score}
                eliminated={eliminated}
                onPress={() => handleCellPress(roundIndex, playerIndex)}
                disabled={isViewOnly}
                cellWidth={cellWidth}
                rowHeight={rowHeight}
              />
            );
          })}
          {/* Round total */}
          <View style={[styles.roundTotalCell, { height: rowHeight }]}>
            <Text style={styles.roundTotalText}>{getRoundTotal(roundIndex)}</Text>
          </View>
        </View>
      ))}

      {/* Totals Row */}
      <View style={styles.totalRow}>
        <View style={[styles.roundLabel, { height: rowHeight + 4, borderTopWidth: 2, borderTopColor: COLORS.accent }]}>
          <Text style={styles.totalLabel}>∑</Text>
        </View>
        {game.players.map((player, index) => {
          const total = getPlayerTotal(game, index);
          const eliminated = isEliminated(game, index);
          const warning = isWarning(game, index);
          const rank = playerRanks[index];
          return (
            <View
              key={player.id}
              style={[
                styles.totalCell,
                { width: cellWidth, height: rowHeight + 4 },
                eliminated && styles.totalCellEliminated,
                warning && styles.totalCellWarning,
              ]}
            >
              <Text
                style={[
                  styles.totalText,
                  eliminated && styles.totalTextEliminated,
                  warning && styles.totalTextWarning,
                ]}
              >
                {total}
              </Text>
              {eliminated ? (
                <Text style={styles.elimBadge}>✕</Text>
              ) : rank !== undefined ? (
                <Text style={[styles.rankBadge, rank === 1 && styles.rankFirst]}>
                  {rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`}
                </Text>
              ) : null}
            </View>
          );
        })}
        <View style={[styles.roundTotalCell, { height: rowHeight + 4, borderTopWidth: 2, borderTopColor: COLORS.accent }]} />
      </View>

      <View style={{ height: BOTTOM_BAR_HEIGHT + 40 }} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Confetti visible={showConfetti} />
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleEndGame}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {isViewOnly ? 'final scores' : 'scorecard'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {game.rounds.length}R · {getActivePlayers(game).length} active
          </Text>
        </View>
        <View style={styles.headerActions}>
          {!isViewOnly && game.lastAction && (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={handleUndo}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-undo" size={18} color={COLORS.warning} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Winner Banner */}
      {winner && (
        <Animated.View
          style={[
            styles.winnerBanner,
            {
              opacity: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
              transform: [{ translateY: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
            },
          ]}
        >
          <Text style={styles.winnerCrown}>♛</Text>
          <Text style={styles.winnerBannerText}>{winner.name} wins!</Text>
        </Animated.View>
      )}

      {/* Score Table with horizontal scroll for many players */}
      {needsHorizontalScroll ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          ref={horizontalScrollRef}
          style={styles.tableContainer}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            ref={verticalScrollRef}
            stickyHeaderIndices={[0]}
          >
            {renderTableContent()}
          </ScrollView>
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          ref={verticalScrollRef}
          style={styles.tableContainer}
          stickyHeaderIndices={[0]}
        >
          {renderTableContent()}
        </ScrollView>
      )}

      {/* Bottom Action Bar */}
      {!isViewOnly && (
        <Animated.View style={[styles.bottomBar, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.addRoundButton}
            onPress={handleAddRound}
            activeOpacity={0.7}
          >
            <Text style={styles.addRoundPlus}>+</Text>
            <Text style={styles.addRoundText}>add round</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {isViewOnly && (
        <Animated.View style={[styles.bottomBar, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.newGameBtn}
            onPress={() => router.replace('/setup')}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={16} color={COLORS.accent} />
            <Text style={styles.newGameBtnText}>new game</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => router.replace('/')}
            activeOpacity={0.7}
          >
            <Ionicons name="home-outline" size={16} color={COLORS.text} />
            <Text style={styles.homeBtnText}>home</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <NumPad
        visible={numPadVisible}
        playerName={selectedCell ? game.players[selectedCell.playerIndex].name : ''}
        currentTotal={selectedCell ? getPlayerTotal(game, selectedCell.playerIndex) : 0}
        onSubmit={handleScoreSubmit}
        onClose={() => {
          setNumPadVisible(false);
          setSelectedCell(null);
        }}
      />

      <GameModal
        visible={showEndGameModal}
        title="end game"
        message="Are you sure you want to leave? Your progress is saved."
        suit="♠"
        stats={[
          { label: 'rounds', value: `${game.rounds.length}` },
          { label: 'active', value: `${getActivePlayers(game).length} / ${game.players.length}` },
          { label: 'leader', value: getLeaderName(), color: COLORS.gold },
          { label: 'duration', value: getFormattedDuration() },
        ]}
        actions={[
          { text: 'cancel', onPress: () => setShowEndGameModal(false), style: 'cancel' },
          { text: 'end game', onPress: () => { setShowEndGameModal(false); router.replace('/'); }, style: 'destructive' },
        ]}
        onClose={() => setShowEndGameModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
    flex: 1, backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center', gap: SPACING.lg,
  },
  loadingText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md },
  errorIcon: { fontSize: 32, color: COLORS.textMuted },
  errorText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, letterSpacing: 2 },
  errorBtn: {
    paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.md,
    borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.accent + '50',
  },
  errorBtnText: { color: COLORS.accent, fontSize: FONT_SIZE.sm, letterSpacing: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 56, paddingBottom: SPACING.sm, paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  headerCenter: { flex: 1, paddingHorizontal: SPACING.md },
  headerTitle: {
    fontSize: FONT_SIZE.lg, fontWeight: '300',
    color: COLORS.text, letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.xs, color: COLORS.textMuted,
    marginTop: 2, letterSpacing: 1,
  },
  headerActions: { flexDirection: 'row', gap: SPACING.sm },

  // Winner
  winnerBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, backgroundColor: COLORS.gold,
    paddingVertical: SPACING.sm,
  },
  winnerCrown: { fontSize: 16, color: COLORS.background },
  winnerBannerText: {
    fontSize: FONT_SIZE.md, fontWeight: '700',
    color: COLORS.background, letterSpacing: 1,
  },

  // Table
  tableContainer: { flex: 1 },
  tableHeader: {
    flexDirection: 'row', backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  roundLabel: {
    width: LABEL_WIDTH,
    alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: COLORS.border,
  },
  roundLabelText: {
    fontSize: FONT_SIZE.xs, fontWeight: '600',
    color: COLORS.textMuted, letterSpacing: 1,
  },
  headerCell: {
    alignItems: 'center', justifyContent: 'center',
    gap: 2, paddingHorizontal: 2,
    borderRightWidth: 1, borderRightColor: COLORS.border,
  },
  headerCellEliminated: { opacity: 0.4 },
  headerGradientLine: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
  },
  headerSuit: { fontSize: 12 },
  headerName: {
    fontSize: FONT_SIZE.xs, fontWeight: '500',
    color: COLORS.text,
  },
  headerNameEliminated: {
    color: COLORS.textMuted, textDecorationLine: 'line-through',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  roundNumber: {
    fontSize: FONT_SIZE.xs, fontWeight: '500',
    color: COLORS.textMuted, fontVariant: ['tabular-nums'],
  },
  cell: {
    alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: COLORS.border,
  },
  cellEliminated: { backgroundColor: COLORS.dangerGlow, opacity: 0.3 },
  cellFilled: { backgroundColor: COLORS.accentGlow },
  cellText: {
    fontSize: FONT_SIZE.md, fontWeight: '600',
    color: COLORS.text, fontVariant: ['tabular-nums'],
  },
  cellTextEliminated: { color: COLORS.textMuted },
  cellTextZero: { color: COLORS.success },

  // Round totals
  roundTotalCell: {
    width: 40, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  roundTotalText: {
    fontSize: FONT_SIZE.xs, fontWeight: '500',
    color: COLORS.textMuted, fontVariant: ['tabular-nums'],
  },

  // Totals
  totalRow: {
    flexDirection: 'row', backgroundColor: COLORS.surface,
  },
  totalLabel: {
    fontSize: FONT_SIZE.lg, fontWeight: '300', color: COLORS.accent,
  },
  totalCell: {
    alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: COLORS.border,
    borderTopWidth: 2, borderTopColor: COLORS.accent,
  },
  totalCellEliminated: { backgroundColor: COLORS.dangerGlow },
  totalCellWarning: { backgroundColor: COLORS.warningGlow },
  totalText: {
    fontSize: FONT_SIZE.lg, fontWeight: '800',
    color: COLORS.accent, fontVariant: ['tabular-nums'],
  },
  totalTextEliminated: { color: COLORS.danger },
  totalTextWarning: { color: COLORS.warning },
  elimBadge: {
    fontSize: 8, color: COLORS.danger, fontWeight: '800',
    marginTop: 1,
  },
  rankBadge: {
    fontSize: 7, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 0.5, marginTop: 1,
  },
  rankFirst: {
    color: COLORS.gold,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: SPACING.md,
    paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.md, paddingBottom: 32,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  addRoundButton: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.md, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.accent + '50',
    backgroundColor: COLORS.accentGlow,
  },
  addRoundPlus: { fontSize: 18, color: COLORS.accent, fontWeight: '200' },
  addRoundText: { fontSize: FONT_SIZE.sm, fontWeight: '500', color: COLORS.accent, letterSpacing: 1 },
  newGameBtn: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.md, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.accent + '50',
  },
  newGameBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '500', color: COLORS.accent, letterSpacing: 1 },
  homeBtn: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.md, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
  },
  homeBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '500', color: COLORS.text, letterSpacing: 1 },
});
