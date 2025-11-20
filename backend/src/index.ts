import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import goalRoutes from './routes/goals';
import enrollmentRoutes from './routes/enrollments';
import { authenticate } from './middleware/auth';

const prisma = new PrismaClient();
const fastify = Fastify({ logger: true });

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Register plugins
fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production',
  sign: {
    expiresIn: '15m',
  },
});

// Make Prisma and authenticate middleware available throughout the app
fastify.decorate('prisma', prisma);
fastify.decorate('authenticate', authenticate);

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(goalRoutes, { prefix: '/api/goals' });
fastify.register(enrollmentRoutes, { prefix: '/api/enrollments' });

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`🚀 Server listening on http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
