import Pusher from 'pusher-js';

// Global tanımlamayı düzelt
declare global {
  interface Window {
    pusherClient: Pusher;
  }
}

let pusherClient: Pusher;

if (typeof window !== "undefined") {
  const PUSHER_KEY = '47a473b92331a6b6daac'; // Doğrudan değeri kullanın
  const PUSHER_CLUSTER = 'eu'; // Doğrudan değeri kullanın
  
  if (!window.pusherClient) {
    window.pusherClient = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
    });
  }
  
  pusherClient = window.pusherClient;
}

export { pusherClient };
