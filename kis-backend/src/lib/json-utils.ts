import { Prisma } from '@prisma/client';

/**
 * Utility functions for JSON/Prisma type conversions
 */

// Convert unknown to Prisma JSON input type
export const toJson = (value: unknown): Prisma.InputJsonValue => {
  return value as Prisma.InputJsonValue;
};

// Convert JsonValue to typed array safely
export function fromJsonArray<T>(value: Prisma.JsonValue | null): T[] | null {
  if (value === null) {
    return null;
  }

  if (Array.isArray(value)) {
    return value as T[];
  }

  return null;
}

// Convert JsonValue to typed object safely
export function fromJsonObject<T>(value: Prisma.JsonValue | null): T | null {
  if (value === null) {
    return null;
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as T;
  }

  return null;
}

// Safe error handling for unknown errors
export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}