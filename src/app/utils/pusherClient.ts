import Pusher from 'pusher-js';

declare global {
  var pusherClient: Pusher | undefined;
}

let pusherClient: Pusher;

if (typeof window !== "undefined") {
  if (!global.pusherClient) {
    global.pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }
  
  pusherClient = global.pusherClient;
}

export { pusherClient };
