import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '@yaqin/database';

let io: Server | null = null;

const JWT_SECRET = process.env.JWT_SECRET || 'yaqin-ultra-secure-jwt-secret-min-32-chars-long';

export const initChatSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Socket middleware: Avtorizatsiya tekshiruvi
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication token talab qilinadi'));
      }

      const payload = jwt.verify(token, JWT_SECRET) as { sub: string; telegramId: string };
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, firstName: true, isBanned: true },
      });

      if (!user || user.isBanned) {
        return next(new Error('Foydalanuvchi bloklangan yoki topilmadi'));
      }

      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error('Yaroqsiz token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    console.log(`[Socket Connected] User: ${user.firstName} (${user.id})`);

    // Foydalanuvchining shaxsiy xonasi (bildirishnomalar va match hodisalari uchun)
    socket.join(`user_${user.id}`);

    // Match xonasiga qo'shilish
    socket.on('join_match', async (matchId: string) => {
      // Foydalanuvchi ushbu match a'zosimi?
      const match = await prisma.match.findUnique({
        where: { id: matchId },
      });

      if (match && (match.userAId === user.id || match.userBId === user.id)) {
        socket.join(`match_${matchId}`);
        console.log(`[Socket Room] User ${user.id} joined match_${matchId}`);
      }
    });

    // Match xonasidan chiqish
    socket.on('leave_match', (matchId: string) => {
      socket.leave(`match_${matchId}`);
    });

    // "Yozmoqda..." (Typing indicator) hodisasi
    socket.on('typing_start', (matchId: string) => {
      socket.to(`match_${matchId}`).emit('user_typing', { matchId, userId: user.id });
    });

    socket.on('typing_stop', (matchId: string) => {
      socket.to(`match_${matchId}`).emit('user_stopped_typing', { matchId, userId: user.id });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket Disconnected] User: ${user.id}`);
    });
  });

  return io;
};

export const getSocketIO = (): Server | null => {
  return io;
};
