import { ELIMINATION_THRESHOLD, WARNING_THRESHOLD } from '../constants/theme';

/** Sentinel value for a score cell that hasn't been entered yet */
export const SCORE_NOT_ENTERED = -1;

export interface Player {
  id: string;
  name: string;
}

export interface Game {
  id: string;
  players: Player[];
  rounds: number[][]; // rounds[roundIndex][playerIndex] = score (-1 means not entered)
  createdAt: number;
  updatedAt: number;
  isFinished: boolean;
  winnerId: string | null;
  lastAction: {
    type: 'setScore';
    roundIndex: number;
    playerIndex: number;
    previousValue: number;
  } | null;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function createGame(playerNames: string[]): Game {
  const players: Player[] = playerNames.map((name) => ({
    id: generateId(),
    name: name.trim(),
  }));

  return {
    id: generateId(),
    players,
    rounds: [new Array(players.length).fill(SCORE_NOT_ENTERED)],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFinished: false,
    winnerId: null,
    lastAction: null,
  };
}

export function addRound(game: Game): Game {
  return {
    ...game,
    rounds: [...game.rounds, new Array(game.players.length).fill(SCORE_NOT_ENTERED)],
    updatedAt: Date.now(),
  };
}

export function setScore(
  game: Game,
  roundIndex: number,
  playerIndex: number,
  score: number
): Game {
  const newRounds = game.rounds.map((round) => [...round]);
  const previousValue = newRounds[roundIndex][playerIndex];
  newRounds[roundIndex][playerIndex] = score;

  const updatedGame: Game = {
    ...game,
    rounds: newRounds,
    updatedAt: Date.now(),
    lastAction: {
      type: 'setScore',
      roundIndex,
      playerIndex,
      previousValue,
    },
  };

  return checkGameState(updatedGame);
}

export function undoLastScore(game: Game): Game {
  if (!game.lastAction) return game;

  const { roundIndex, playerIndex, previousValue } = game.lastAction;
  const newRounds = game.rounds.map((round) => [...round]);
  newRounds[roundIndex][playerIndex] = previousValue;

  return checkGameState({
    ...game,
    rounds: newRounds,
    updatedAt: Date.now(),
    lastAction: null,
    isFinished: false,
    winnerId: null,
  });
}

export function getPlayerTotal(game: Game, playerIndex: number): number {
  return game.rounds.reduce((sum, round) => {
    const score = round[playerIndex];
    return sum + (score > 0 ? score : 0);
  }, 0);
}

export function isEliminated(game: Game, playerIndex: number): boolean {
  return getPlayerTotal(game, playerIndex) >= ELIMINATION_THRESHOLD;
}

export function isWarning(game: Game, playerIndex: number): boolean {
  const total = getPlayerTotal(game, playerIndex);
  return total >= WARNING_THRESHOLD && total < ELIMINATION_THRESHOLD;
}

export function getActivePlayers(game: Game): { player: Player; index: number }[] {
  return game.players
    .map((player, index) => ({ player, index }))
    .filter(({ index }) => !isEliminated(game, index));
}

function checkGameState(game: Game): Game {
  const active = getActivePlayers(game);

  if (active.length === 1 && game.players.length > 1) {
    return {
      ...game,
      isFinished: true,
      winnerId: active[0].player.id,
    };
  }

  if (active.length === 0) {
    return {
      ...game,
      isFinished: true,
      winnerId: null,
    };
  }

  return {
    ...game,
    isFinished: false,
    winnerId: null,
  };
}

export function getWinner(game: Game): Player | null {
  if (!game.winnerId) return null;
  return game.players.find((p) => p.id === game.winnerId) || null;
}

export function isRoundComplete(game: Game, roundIndex: number): boolean {
  return game.rounds[roundIndex].every((score, playerIndex) => {
    return score !== SCORE_NOT_ENTERED || isEliminated(game, playerIndex);
  });
}

export function getLastRoundIndex(game: Game): number {
  return game.rounds.length - 1;
}
