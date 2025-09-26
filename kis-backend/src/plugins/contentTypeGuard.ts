import fp from "fastify-plugin";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export default fp(async function contentTypeGuard(fastify: FastifyInstance) {
  fastify.addHook("onRequest", async (req: FastifyRequest, reply: FastifyReply) => {
    const method = (req.method || "GET").toUpperCase();
    if (method === "POST" || method === "PUT" || method === "PATCH") {
      const contentType = (req.headers["content-type"] || "").toLowerCase();
      if (!contentType.includes("application/json")) {
        return reply.code(415).type("application/json; charset=utf-8").send({
          code: "UNSUPPORTED_MEDIA_TYPE",
          message: "Content-Type은 application/json 이어야 합니다.",
          hint: "Content-Type: application/json; charset=utf-8"
        });
      }
    }
  });
});
