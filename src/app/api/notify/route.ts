import { NextResponse } from 'next/server';
import { pusherServer } from '@/app/utils/pusher';

export async function POST(request: Request) {
  try {
    const { roomCode, event, data } = await request.json();
    
    await pusherServer.trigger(`room-${roomCode}`, event, data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bildirim API hatası:", error);
    return NextResponse.json({ success: false, error: 'Bildirim gönderilirken hata oluştu' });
  }
}
