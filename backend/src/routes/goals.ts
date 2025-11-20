import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';

const createGoalSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(50).max(500),
  citation: z.string().optional(),
  totalDays: z.number().int().min(5),
  tags: z.array(z.string()).min(1).max(5),
  chatEnabled: z.boolean().default(false),
  days: z.array(z.object({
    dayIndex: z.number().int().min(1),
    title: z.string().min(1).max(200),
    briefPreview: z.string().max(500).optional(),
    contentType: z.enum(['text', 'exercise', 'checklist']),
    contentPayload: z.any(),
  })),
});

export default async function goalRoutes(fastify: FastifyInstance) {
  // Get all published goals (public)
  fastify.get('/', async (request, reply) => {
    try {
      const goals = await fastify.prisma.goal.findMany({
        where: { approvalStatus: 'published' },
        select: {
          id: true,
          title: true,
          description: true,
          totalDays: true,
          tags: true,
          createdAt: true,
          author: {
            select: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return reply.send({
        goals: goals.map((goal) => ({
          ...goal,
          authorName: goal.author.user.name,
          enrollmentCount: goal._count.enrollments,
        })),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get single goal by ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const goal = await fastify.prisma.goal.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              user: {
                select: {
                  name: true,
                  id: true,
                },
              },
              bio: true,
            },
          },
          days: {
            orderBy: {
              dayIndex: 'asc',
            },
            select: {
              id: true,
              dayIndex: true,
              title: true,
              briefPreview: true,
              contentType: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      });

      if (!goal) {
        return reply.status(404).send({ error: 'Goal not found' });
      }

      if (goal.approvalStatus !== 'published') {
        return reply.status(403).send({ error: 'Goal not available' });
      }

      return reply.send({ goal });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Create new goal (author only)
  fastify.post('/', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user!.id;

      // Check if user is an author
      const author = await fastify.prisma.author.findUnique({
        where: { userId },
      });

      if (!author || author.status !== 'active') {
        return reply.status(403).send({ error: 'Author access required' });
      }

      const body = createGoalSchema.parse(request.body);

      // Create goal with days
      const goal = await fastify.prisma.goal.create({
        data: {
          authorId: author.id,
          title: body.title,
          description: body.description,
          citation: body.citation,
          totalDays: body.totalDays,
          tags: body.tags,
          chatEnabled: body.chatEnabled,
          approvalStatus: 'draft',
          days: {
            create: body.days.map((day) => ({
              dayIndex: day.dayIndex,
              title: day.title,
              briefPreview: day.briefPreview,
              contentType: day.contentType,
              contentPayload: day.contentPayload,
            })),
          },
        },
        include: {
          days: true,
        },
      });

      return reply.status(201).send({ goal });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get day content (for enrolled users)
  fastify.get('/:goalId/days/:dayIndex', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const { goalId, dayIndex } = request.params as { goalId: string; dayIndex: string };
      const userId = request.user!.id;

      // Check if user is enrolled
      const enrollment = await fastify.prisma.enrollment.findFirst({
        where: {
          userId,
          goalId,
          status: 'active',
        },
      });

      if (!enrollment) {
        return reply.status(403).send({ error: 'Not enrolled in this goal' });
      }

      const dayIndexNum = parseInt(dayIndex, 10);

      // Check if user can access this day (sequential access only)
      if (dayIndexNum > enrollment.currentDayIndex) {
        return reply.status(403).send({
          error: 'Day not unlocked yet',
          currentDay: enrollment.currentDayIndex,
        });
      }

      const goalDay = await fastify.prisma.goalDay.findFirst({
        where: {
          goalId,
          dayIndex: dayIndexNum,
        },
      });

      if (!goalDay) {
        return reply.status(404).send({ error: 'Day not found' });
      }

      return reply.send({ day: goalDay });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
