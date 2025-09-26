import fp from "fastify-plugin";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

type Branch = {
  qty?: number;
  count?: number;
  [key: string]: unknown;
};

type CreateBody = {
  branches?: Branch[];
  [key: string]: unknown;
};

function schemaError(reply: FastifyReply, message: string, path?: string, hint?: string) {
  return reply.code(422).type("application/json; charset=utf-8").send({
    code: "SCHEMA_VALIDATION_ERROR",
    message,
    path,
    hint
  });
}

function resolveRouteUrl(req: FastifyRequest): string {
  const routePath = (req as any).routerPath;
  if (typeof routePath === "string" && routePath.length > 0) {
    return routePath;
  }
  const url = req.routeOptions?.url;
  if (typeof url === "string" && url.length > 0) {
    return url;
  }
  return req.url || "";
}

function isTargetEstimateRoute(req: FastifyRequest) {
  const method = (req.method || "GET").toUpperCase();
  if (method !== "POST") return false;
  const routeUrl = resolveRouteUrl(req);
  return routeUrl === "/v1/estimate/create" || routeUrl === "/estimate/create";
}

export default fp(async function qtyCountPolicy(fastify: FastifyInstance) {
  const allowAlias = String(process.env.KIS_ALLOW_COUNT_ALIAS || "").toLowerCase() === "true";

  fastify.addHook("preValidation", async (req: FastifyRequest, reply: FastifyReply) => {
    if (!isTargetEstimateRoute(req)) {
      return;
    }

    const body = req.body as CreateBody;
    const branches = Array.isArray(body?.branches) ? body.branches! : [];

    for (let i = 0; i < branches.length; i += 1) {
      const branch = branches[i] || {};
      const hasQty = typeof branch.qty !== "undefined";
      const hasCount = typeof branch.count !== "undefined";

      if (hasQty && hasCount) {
        return schemaError(
          reply,
          `branches[${i}]: 'qty' and 'count' cannot be provided together. Use 'qty' only.`,
          `branches[${i}].qty`,
          "Send only the qty field (count is deprecated)."
        );
      }

      if (!hasQty && hasCount) {
        if (!allowAlias) {
          return schemaError(
            reply,
            `branches[${i}]: 'qty' is required. Legacy 'count' is not accepted.`,
            `branches[${i}].qty`,
            "Provide qty as a positive integer."
          );
        }
        const parsed = Number(branch.count);
        if (!Number.isInteger(parsed) || parsed < 1) {
          return schemaError(
            reply,
            `branches[${i}].count must be an integer (>=1).`,
            `branches[${i}].count`,
            "Use a positive integer."
          );
        }
        branch.qty = parsed;
        delete branch.count;
      }

      if (hasQty) {
        const parsed = Number(branch.qty);
        if (!Number.isInteger(parsed) || parsed < 1) {
          return schemaError(
            reply,
            `branches[${i}].qty must be an integer (>=1).`,
            `branches[${i}].qty`,
            "Example: { \"qty\": 1 }"
          );
        }
      }
    }
  });
});
