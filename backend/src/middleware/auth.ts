import { FastifyRequest, FastifyReply } from 'fastify';

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
}

export async function requireRole(role: string | string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();

      const userRole = request.user?.role;
      const allowedRoles = Array.isArray(role) ? role : [role];

      if (!userRole || !allowedRoles.includes(userRole)) {
        reply.status(403).send({ error: 'Forbidden: Insufficient permissions' });
      }
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  };
}
