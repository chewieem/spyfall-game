// Game related types

export interface Player {
  id: number;
  name: string;
  isHost: boolean;
}

export interface Location {
  id: string;
  name: string;
  image?: string;
  description?: string;
  roles?: string[];
}

export interface LocationGroup {
  id: string;
  name: string;
  description: string;
  image: string;
  locations: string[];
}

export interface GameState {
  players: Player[];
  currentPlayer: Player | null;
  gameCode: string;
  location: string;
  spy: Player | null;
  timeRemaining: number;
  selectedLocations: Location[];
}

export type GameScreen = 'main' | 'create' | 'join' | 'rules' | 'waiting' | 'game' | 'roundEnd' | 'location-select';
