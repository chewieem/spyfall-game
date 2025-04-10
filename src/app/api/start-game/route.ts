import { NextResponse } from 'next/server';
import { pusherServer } from '@/app/utils/pusher';
import { Location } from '@/app/types';
import { rooms } from '@/app/lib/rooms';

export async function POST(request: Request) {
  try {
    const { roomCode, selectedLocation, gameTime } = await request.json();
    console.log("API'da alınan veriler:", roomCode, selectedLocation, gameTime);
    console.log("Mevcut odalar:", Object.keys(rooms));
    
    if (!rooms[roomCode]) {
      console.error("Oda bulunamadı:", roomCode);
      return NextResponse.json({ 
        success: false, 
        error: 'Oda bulunamadı' 
      }, { status: 404 });
    }
    
    const gameState = rooms[roomCode];
    
    // Rastgele bir casusu belirle
    const randomPlayerIndex = Math.floor(Math.random() * gameState.players.length);
    const spy = gameState.players[randomPlayerIndex];
    
    console.log("Seçilen casus:", spy);
    
    // Oyun durumunu güncelle
    gameState.location = selectedLocation.name;
    gameState.spy = spy;
    gameState.timeRemaining = gameTime * 60; // Saniye cinsinden
    gameState.selectedLocations = [selectedLocation];
    
    // Pusher ile tüm oyunculara oyunun başladığını bildir
    await pusherServer.trigger(`room-${roomCode}`, 'game-started', {
      gameState: gameState
    });
    
    console.log("Oyun başlatıldı ve Pusher event'i gönderildi");
    
    return NextResponse.json({
      success: true,
      gameState: gameState
    });
  } catch (error) {
    console.error("API hatası:", error);
    return NextResponse.json({ 
      success: false, 
      error: 'Sunucu hatası' 
    }, { status: 500 });
  }
}
