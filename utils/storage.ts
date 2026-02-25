import AsyncStorage from '@react-native-async-storage/async-storage';
import { Game } from './gameLogic';

const GAMES_KEY = 'least_count_games';
const CURRENT_GAME_KEY = 'least_count_current_game';
const MAX_GAMES = 20;

export async function saveGame(game: Game): Promise<void> {
  try {
    await AsyncStorage.setItem(CURRENT_GAME_KEY, JSON.stringify(game));

    let allGames = await getAllGames();
    const existingIndex = allGames.findIndex((g) => g.id === game.id);

    if (existingIndex >= 0) {
      allGames[existingIndex] = game;
    } else {
      allGames.unshift(game);
    }

    // Keep only the most recent MAX_GAMES to prevent unbounded storage growth
    if (allGames.length > MAX_GAMES) {
      allGames = allGames.slice(0, MAX_GAMES);
    }

    await AsyncStorage.setItem(GAMES_KEY, JSON.stringify(allGames));
  } catch (error) {
    console.error('Failed to save game:', error);
  }
}

export async function loadCurrentGame(): Promise<Game | null> {
  try {
    const data = await AsyncStorage.getItem(CURRENT_GAME_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load current game:', error);
    return null;
  }
}

export async function getAllGames(): Promise<Game[]> {
  try {
    const data = await AsyncStorage.getItem(GAMES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load games:', error);
    return [];
  }
}

export async function deleteGame(gameId: string): Promise<void> {
  try {
    const allGames = await getAllGames();
    const filtered = allGames.filter((g) => g.id !== gameId);
    await AsyncStorage.setItem(GAMES_KEY, JSON.stringify(filtered));

    const current = await loadCurrentGame();
    if (current && current.id === gameId) {
      await AsyncStorage.removeItem(CURRENT_GAME_KEY);
    }
  } catch (error) {
    console.error('Failed to delete game:', error);
  }
}

export async function clearCurrentGame(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CURRENT_GAME_KEY);
  } catch (error) {
    console.error('Failed to clear current game:', error);
  }
}

export async function clearAllGames(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GAMES_KEY);
    await AsyncStorage.removeItem(CURRENT_GAME_KEY);
  } catch (error) {
    console.error('Failed to clear all games:', error);
  }
}
