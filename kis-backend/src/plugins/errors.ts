import fp from "fastify-plugin";
import { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ErrorObject } from "ajv";
import { KISError } from "../lib/errors.js";

type SchemaErr = {
  code: string;
  message: string;
  path?: string;
  hint?: string;
  errors?: Array<{ path?: string; message?: string }>;
};

function ajvToSchemaBody(errors: ErrorObject[]): SchemaErr {
  const details = errors.map((error) => {
    const path = (error.instancePath || error.schemaPath || "").toString();
    const message = error.message || "invalid";
    return { path, message };
  });
  const first = errors[0];
  const path = (first?.instancePath || "").toString() || undefined;
  const hint = first?.message || undefined;
  return {
    code: "SCHEMA_VALIDATION_ERROR",
    message: "요청 본문이 스키마와 일치하지 않습니다.",
    path,
    hint,
    errors: details
  };
}

function isAjvValidationError(err: FastifyError): err is FastifyError & { validation: ErrorObject[] } {
  return Array.isArray((err as any)?.validation) && (err as any).validation.length > 0;
}

const JSON_ERROR_CODES = new Set([
  "FST_ERR_JSON_BODY_PARSE",
  "FST_ERR_CTP_INVALID_JSON_BODY",
  "FST_ERR_CTP_EMPTY_JSON_BODY"
]);

function isJsonParseError(err: FastifyError) {
  return typeof err.code === "string" && JSON_ERROR_CODES.has(err.code);
}

export default fp(async function errorsPlugin(fastify: FastifyInstance) {
  fastify.setSchemaErrorFormatter((errors) => {
    const body = ajvToSchemaBody(errors);
    const formatted = new Error(JSON.stringify(body));
    (formatted as any).statusCode = 422;
    (formatted as any).validation = errors;
    (formatted as any).code = body.code;
    return formatted;
  });

  fastify.setErrorHandler(async (err: FastifyError, _req: FastifyRequest, reply: FastifyReply) => {
    if (err instanceof KISError) {
      return reply.code(err.statusCode).type("application/json; charset=utf-8").send(err.toJSON());
    }

    if (isAjvValidationError(err)) {
      let body: SchemaErr;
      try {
        body = JSON.parse(err.message) as SchemaErr;
      } catch {
        body = ajvToSchemaBody(err.validation);
      }
      return reply.code(422).type("application/json; charset=utf-8").send(body);
    }

    if (isJsonParseError(err)) {
      return reply.code(400).type("application/json; charset=utf-8").send({
        code: "BAD_REQUEST",
        message: "요청 본문을 JSON으로 파싱할 수 없습니다.",
        hint: "올바른 JSON 형식을 사용하세요."
      });
    }

    if (typeof err.statusCode === "number" && err.statusCode >= 400 && err.statusCode < 500) {
      return reply.code(err.statusCode).type("application/json; charset=utf-8").send({
        code: err.code || "BAD_REQUEST",
        message: err.message || "잘못된 요청입니다."
      });
    }

    fastify.log.error({ err }, "Unhandled error captured by errorsPlugin");

    const body: { code: string; message: string; debug?: { message?: string; stack?: string } } = {
      code: "INTERNAL_ERROR",
      message: "서버 내부 오류가 발생했습니다."
    };

    if (process.env.NODE_ENV !== "production") {
      body.debug = { message: err.message, stack: err.stack };
    }

    return reply.code(500).type("application/json; charset=utf-8").send(body);
  });
});
