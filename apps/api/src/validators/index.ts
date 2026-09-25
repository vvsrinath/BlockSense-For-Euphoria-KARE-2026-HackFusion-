/**
 * Request validation.
 *
 * Reuses the zod schemas from `@blocksense/shared` so the API and the browser
 * reject the same malformed input. Parsing and unwrapping in one step keeps
 * controllers free of defensive null checks.
 */

import { AddressSchema, ChainIdSchema, HashSchema, SearchQuerySchema } from '@blocksense/shared';
import { z } from 'zod';
import type { RequestContext } from '../middleware/router';

export const DepthSchema = z.coerce.number().int().min(1).max(4);
export const LimitSchema = z.coerce.number().int().min(1).max(100);

function fail(message: string, status = 400): never {
  const err = new Error(message) as Error & { status?: number };
  err.status = status;
  throw err;
}

/** Parse a path parameter. */
export function param<T extends z.ZodTypeAny>(ctx: RequestContext, name: string, schema: T): z.infer<T> {
  const result = schema.safeParse(ctx.params[name]);
  if (!result.success) fail(`Invalid value for "${name}".`);
  return result.data;
}

/** Parse a query parameter, falling back when it was not supplied. */
export function query<T extends z.ZodTypeAny>(
  ctx: RequestContext,
  name: string,
  schema: T,
  fallback?: z.infer<T>
): z.infer<T> {
  const raw = ctx.query.get(name);
  if (raw === null) {
    if (fallback !== undefined) return fallback;
    fail(`Missing query parameter "${name}".`);
  }
  const result = schema.safeParse(raw);
  if (!result.success) fail(`Invalid value for "${name}".`);
  return result.data;
}

/** Parse and validate a JSON request body. */
export function body<T extends z.ZodTypeAny>(ctx: RequestContext, schema: T): z.infer<T> {
  return schema.parse(ctx.body ?? {});
}

export const chainParam = (ctx: RequestContext) => param(ctx, 'chain', ChainIdSchema);

/**
 * Read a `:chain` segment only if the route has one.
 *
 * Paired with the chain-inferring aliases in `routes/index.ts`, so a request
 * that names a chain is authoritative and one that does not still works.
 */
export const optionalChainParam = (ctx: RequestContext) =>
  ctx.params.chain === undefined ? undefined : param(ctx, 'chain', ChainIdSchema);
export const addressParam = (ctx: RequestContext) => param(ctx, 'address', AddressSchema);
export const hashParam = (ctx: RequestContext) => param(ctx, 'hash', HashSchema);
export const searchParam = (ctx: RequestContext) => query(ctx, 'q', SearchQuerySchema);

export const depthQuery = (ctx: RequestContext) => query(ctx, 'depth', DepthSchema, 2);
export const limitQuery = (ctx: RequestContext) => query(ctx, 'limit', LimitSchema, 25);

/** Body for `POST /api/analyze`. */
export const AnalyzeRequestSchema = z.object({
  hash: HashSchema,
  chain: ChainIdSchema.optional(),
  /** Restrict the analysis to transfers touching this address. */
  focusAddress: AddressSchema.optional()
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
