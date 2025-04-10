// Game related types

export interface Player {
  id: number;
  name: string;
  isHost: boolean;
}

export interface GameState {
  players: Player[];
  currentPlayer: Player | null;
  gameCode: string;
  location: string;
  spy: Player | null;
  timeRemaining: number;
  locationPack: string;
}

export type LocationPack = 'standard' | 'extended';
export type GameScreen = 'main' | 'create' | 'join' | 'rules' | 'waiting' | 'game' | 'roundEnd';
