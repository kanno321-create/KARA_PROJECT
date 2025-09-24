/*
 * TypeScript Error Fixes - Summary of Common Patterns
 * This file documents the systematic fixes needed for TS errors
 */

// Fix 1: JSON conversion utilities (already created in json-utils.ts)
// import { toJson, fromJsonArray, toError } from './json-utils.js';

// Fix 2: Error factory mapping - check what error methods exist
// errors.database -> errors.internal
// errors.validation -> errors.reqMoreInfo
// errors.serverError -> errors.internal
// errors.evidenceIntegrityError -> errors.internal

// Fix 3: HTTP status codes - extend response helpers or use reply directly
// Instead of helper(500), use reply.status(500).send(...)

// Fix 4: Prisma JSON types - use toJson() wrapper
// JSON fields: use toJson(data) before saving

// Fix 5: Unknown errors - use toError() wrapper
// catch (err: unknown) -> catch (err) then toError(err)

// Fix 6: Array filtering with type guards
// .filter(Boolean) -> .filter((x): x is NonNullable<typeof x> => Boolean(x))

// Fix 7: Missing return values - ensure all code paths return
// Add explicit returns or throw statements

export const commonFixes = {
  jsonConversion: 'Use toJson() from json-utils',
  errorMapping: 'Map to existing error factory methods',
  httpStatus: 'Use reply.status() directly for 500 errors',
  arrayFiltering: 'Use type guards for filtering',
  unknownErrors: 'Use toError() wrapper',
  missingReturns: 'Add explicit returns'
};