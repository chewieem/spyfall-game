import { NextResponse } from 'next/server';
import { pusherServer } from '@/app/utils/pusher';
import { GameState, Player } from '@/app/types';
import { rooms } from '@/app/lib/rooms';  // rooms'u doğru yoldan import et

// Rastgele 6 karakterli oda kodu oluştur
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  do {
    result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms[result]); // Eğer kod zaten varsa tekrar dene
  
  return result;
}

export async function POST(request: Request) {
  const { hostPlayer } = await request.json();
  const roomCode = generateRoomCode();
  
  // Yeni oyun durumu oluştur
  const gameState: GameState = {
    players: [hostPlayer],
    currentPlayer: hostPlayer,
    gameCode: roomCode,
    location: '',
    spy: null,
    timeRemaining: 0,
    selectedLocations: []
  };
  
  rooms[roomCode] = gameState;
  console.log("Oda oluşturuldu:", roomCode, "Tüm odalar:", Object.keys(rooms));
  
  return NextResponse.json({ 
    success: true, 
    roomCode, 
    gameState 
  });
}

export async function PUT(request: Request) {
  const { roomCode, player } = await request.json();
  
  if (!rooms[roomCode]) {
    return NextResponse.json({ 
      success: false, 
      error: 'Oda bulunamadı' 
    }, { status: 404 });
  }
  
  // Aynı ID'ye sahip oyuncu zaten var mı kontrol et
  const existingPlayer = rooms[roomCode].players.find((p: Player) => p.id === player.id);
  if (existingPlayer) {
    return NextResponse.json({
      success: true,
      gameState: rooms[roomCode]
    });
  }
  
  // Odaya oyuncuyu ekle
  rooms[roomCode].players.push(player);
  
  // Pusher ile tüm oyunculara güncelleme gönder
  await pusherServer.trigger(`room-${roomCode}`, 'player-joined', {
    gameState: rooms[roomCode]
  });
  
  return NextResponse.json({
    success: true,
    gameState: rooms[roomCode]
  });
}

export async function DELETE(request: Request) {
  const { roomCode, playerId } = await request.json();
  
  if (!rooms[roomCode]) {
    return NextResponse.json({ success: false }, { status: 404 });
  }
  
  // Ayrılan oyuncunun host olup olmadığını kontrol et
  const leavingPlayer = rooms[roomCode].players.find((p: Player) => p.id === playerId);
  const wasHostLeaving = leavingPlayer?.isHost || false;
  
  // Oyuncuyu odadan çıkar
  rooms[roomCode].players = rooms[roomCode].players.filter((p: Player) => p.id !== playerId);
  
  // Eğer oda boşsa, odayı sil
  if (rooms[roomCode].players.length === 0) {
    delete rooms[roomCode];
    return NextResponse.json({ success: true });
  }
  
  // Eğer çıkan oyuncu ev sahibiyse, yeni ev sahibi belirle
  if (wasHostLeaving && rooms[roomCode].players.length > 0) {
    // İlk oyuncuyu host yap
    rooms[roomCode].players[0].isHost = true;
    console.log(`Yeni host: ${rooms[roomCode].players[0].name}`);
  }
  
  // Pusher ile tüm oyunculara güncelleme gönder
  await pusherServer.trigger(`room-${roomCode}`, 'player-left', {
    gameState: rooms[roomCode]
  });
  
  return NextResponse.json({ 
    success: true,
    newHost: wasHostLeaving ? rooms[roomCode].players[0] : null
  });
}

// Oda bilgisini almak için GET endpoint'i
export async function GET(request: Request) {
  const url = new URL(request.url);
  const roomCode = url.searchParams.get('roomCode');
  
  if (!roomCode || !rooms[roomCode]) {
    return NextResponse.json({ 
      success: false, 
      error: 'Oda bulunamadı' 
    }, { status: 404 });
  }
  
  return NextResponse.json({
    success: true,
    gameState: rooms[roomCode]
  });
}
