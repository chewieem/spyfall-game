import Pusher from 'pusher-js';

// Global tanımlamayı düzelt
declare global {
  interface Window {
    pusherClient: Pusher;
  }
}

let pusherClient: Pusher;

if (typeof window !== "undefined") {
  if (!window.pusherClient) {
    window.pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }
  
  pusherClient = window.pusherClient;
}

export { pusherClient };
