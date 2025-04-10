import { GameState, Player, Location } from '../types';

class RoomService {
  // Yeni bir oda oluştur
  static async createRoom(hostPlayer: Player): Promise<{ success: boolean; roomCode?: string; gameState?: GameState }> {
    try {
      const response = await fetch('/api/room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hostPlayer })
      });

      return await response.json();
    } catch (error) {
      console.error('Oda oluşturma hatası:', error);
      return { success: false };
    }
  }

  // Odaya katıl
  static async joinRoom(roomCode: string, player: Player): Promise<{ success: boolean; error?: string; gameState?: GameState }> {
    try {
      const response = await fetch('/api/room', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomCode, player })
      });

      return await response.json();
    } catch (error) {
      console.error('Odaya katılma hatası:', error);
      return { success: false, error: 'Bağlantı hatası' };
    }
  }

  // Odadan ayrıl
  static async leaveRoom(roomCode: string, playerId: number): Promise<void> {
    try {
      await fetch('/api/room', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomCode, playerId })
      });
    } catch (error) {
      console.error('Odadan ayrılma hatası:', error);
    }
  }
  
  // Oyunu başlat
  static async startGame(roomCode: string, selectedLocation: Location, gameTime: number): Promise<{ success: boolean; error?: string; gameState?: GameState }> {
    try {
      console.log("API çağrısı başlatılıyor:", roomCode, selectedLocation, gameTime);
      const response = await fetch('/api/start-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomCode, selectedLocation, gameTime })
      });

      const data = await response.json();
      console.log("API yanıtı:", data);
      return data;
    } catch (error) {
      console.error('Oyun başlatma hatası:', error);
      return { success: false, error: 'Bağlantı hatası' };
    }
  }
}

export default RoomService;
