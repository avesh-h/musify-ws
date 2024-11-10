import { Server } from "socket.io";

import dotenv from "dotenv";

dotenv.config();

const connectToSocket = (server: any) => {
  const io = new Server(server, {
    // options
    cors: {
      origin: process.env.URL, // Replace with your Next.js frontend origin
      credentials: true, // Allow cookies if needed
    },
  });

  return io;
};

export { connectToSocket };
