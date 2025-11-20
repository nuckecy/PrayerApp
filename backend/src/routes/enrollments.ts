import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { startOfDay, isToday, isSameDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const enrollSchema = z.object({
  goalId: z.string(),
  groupId: z.string().optional(),
});

const completeDaySchema = z.object({
  dayIndex: z.number().int().min(1),
  completedData: z.any().optional(),
});

function canCompleteToday(
  lastCompletedAt: Date | null,
  userTimezone: string
): {
  canComplete: boolean;
  reason: string;
  nextAvailable?: Date;
} {
  if (!lastCompletedAt) {
    return { canComplete: true, reason: 'No previous completion' };
  }

  const now = new Date();
  const userNow = toZonedTime(now, userTimezone);
  const userToday = startOfDay(userNow);

  const lastCompletedUserTime = toZonedTime(lastCompletedAt, userTimezone);
  const lastCompletedDay = startOfDay(lastCompletedUserTime);

  if (isSameDay(lastCompletedDay, userToday)) {
    const tomorrow = new Date(userToday);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      canComplete: false,
      reason: 'Already completed today. Come back tomorrow!',
      nextAvailable: tomorrow,
    };
  }

  return {
    canComplete: true,
    reason: 'Ready to complete today's goal',
  };
}

export default async function enrollmentRoutes(fastify: FastifyInstance) {
  // Enroll in a goal
  fastify.post('/enroll', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const body = enrollSchema.parse(request.body);

      // Check if goal exists and is published
      const goal = await fastify.prisma.goal.findUnique({
        where: { id: body.goalId },
      });

      if (!goal || goal.approvalStatus !== 'published') {
        return reply.status(404).send({ error: 'Goal not available' });
      }

      // Check if already enrolled
      const existing = await fastify.prisma.enrollment.findFirst({
        where: {
          userId,
          goalId: body.goalId,
          groupId: body.groupId || null,
        },
      });

      if (existing) {
        return reply.status(400).send({ error: 'Already enrolled in this goal' });
      }

      // Calculate projected end date
      const projectedEndDate = new Date();
      projectedEndDate.setDate(projectedEndDate.getDate() + goal.totalDays);

      // Create enrollment
      const enrollment = await fastify.prisma.enrollment.create({
        data: {
          userId,
          goalId: body.goalId,
          groupId: body.groupId,
          currentDayIndex: 1,
          projectedEndDate,
        },
        include: {
          goal: {
            select: {
              title: true,
              description: true,
              totalDays: true,
            },
          },
        },
      });

      return reply.status(201).send({ enrollment });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get user's enrollments
  fastify.get('/my-goals', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user!.id;

      const enrollments = await fastify.prisma.enrollment.findMany({
        where: { userId },
        include: {
          goal: {
            select: {
              id: true,
              title: true,
              description: true,
              totalDays: true,
              tags: true,
              author: {
                select: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          group: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              completions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return reply.send({ enrollments });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Complete a day
  fastify.post('/:id/complete-day', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = request.user!.id;
      const body = completeDaySchema.parse(request.body);

      // Get enrollment
      const enrollment = await fastify.prisma.enrollment.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              timezone: true,
            },
          },
          goal: {
            select: {
              totalDays: true,
            },
          },
        },
      });

      if (!enrollment) {
        return reply.status(404).send({ error: 'Enrollment not found' });
      }

      if (enrollment.userId !== userId) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      // Check if can complete today (Midnight Rule)
      const midnightCheck = canCompleteToday(
        enrollment.lastCompletedAt,
        enrollment.user.timezone
      );

      if (!midnightCheck.canComplete) {
        return reply.status(400).send({
          error: midnightCheck.reason,
          nextAvailable: midnightCheck.nextAvailable,
        });
      }

      // Verify day index matches current day
      if (body.dayIndex !== enrollment.currentDayIndex) {
        return reply.status(400).send({
          error: 'Must complete days in order',
          currentDay: enrollment.currentDayIndex,
        });
      }

      // Get the goal day
      const goalDay = await fastify.prisma.goalDay.findFirst({
        where: {
          goalId: enrollment.goalId,
          dayIndex: body.dayIndex,
        },
      });

      if (!goalDay) {
        return reply.status(404).send({ error: 'Day not found' });
      }

      // Create day completion
      await fastify.prisma.dayCompletion.create({
        data: {
          enrollmentId: enrollment.id,
          goalDayId: goalDay.id,
          dayIndex: body.dayIndex,
          completedData: body.completedData,
        },
      });

      // Update enrollment
      const isCompleted = body.dayIndex >= enrollment.goal.totalDays;
      const updatedEnrollment = await fastify.prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          currentDayIndex: body.dayIndex + 1,
          lastCompletedAt: new Date(),
          streakCount: enrollment.streakCount + 1,
          status: isCompleted ? 'completed' : 'active',
          actualEndDate: isCompleted ? new Date() : null,
        },
      });

      return reply.send({
        enrollment: updatedEnrollment,
        completed: isCompleted,
        message: isCompleted
          ? 'Congratulations! You completed the goal!'
          : 'Day completed successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get enrollment progress
  fastify.get('/:id/progress', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = request.user!.id;

      const enrollment = await fastify.prisma.enrollment.findUnique({
        where: { id },
        include: {
          goal: {
            select: {
              totalDays: true,
            },
          },
          completions: {
            orderBy: {
              dayIndex: 'asc',
            },
            select: {
              dayIndex: true,
              completedAt: true,
            },
          },
        },
      });

      if (!enrollment) {
        return reply.status(404).send({ error: 'Enrollment not found' });
      }

      if (enrollment.userId !== userId) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      return reply.send({
        progress: {
          currentDay: enrollment.currentDayIndex,
          totalDays: enrollment.goal.totalDays,
          completedDays: enrollment.completions.length,
          streakCount: enrollment.streakCount,
          status: enrollment.status,
          completions: enrollment.completions,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
