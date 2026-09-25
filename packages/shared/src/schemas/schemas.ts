/**
 * Validation schemas.
 *
 * Shared by the browser and the API so both sides reject the same malformed
 * input. The API turns a failure here into a 422 with field-level detail; the
 * browser uses it for inline form errors.
 */

import { z } from 'zod';

export const ChainIdSchema = z.enum(['bitcoin', 'ethereum', 'bnb', 'tron', 'solana']);

export const AnomalyLevelSchema = z.enum(['normal', 'unusual', 'high']);

export const AddressSchema = z.string().min(8).max(128);

export const HashSchema = z.string().min(8).max(256);

export const TransactionAssetSchema = z
  .object({
    type: z.enum(['native', 'token', 'nft']),
    name: z.string(),
    symbol: z.string(),
    amount: z.string().optional(),
    contractAddress: z.string().optional(),
    tokenId: z.string().optional(),
    standard: z.string().optional()
  })
  .passthrough();

export const TransactionSchema = z
  .object({
    hash: z.string().min(10),
    chain: ChainIdSchema,
    from: z.string().min(10),
    to: z.string().min(10),
    timestamp: z.number().int().positive(),
    status: z.enum(['confirmed', 'pending', 'failed']),
    asset: TransactionAssetSchema,
    fee: z.object({ amount: z.string(), symbol: z.string() }).passthrough().optional(),
    anomaly: z
      .object({
        score: z.number().min(0).max(100),
        level: AnomalyLevelSchema,
        signals: z.array(z.string())
      })
      .passthrough()
      .optional()
  })
  .passthrough();

export const SearchQuerySchema = z
  .string()
  .trim()
  .min(3, 'Enter at least 3 characters of an address or hash.')
  .max(120, 'That input is too long to be an address or transaction hash.');

export const WatchItemInputSchema = z.object({
  kind: z.enum(['wallet', 'transaction', 'contract', 'token']),
  value: z.string().trim().min(8, 'Enter a full address or hash.'),
  label: z.string().trim().max(40, 'Keep the label under 40 characters.').optional()
});

/** Query parameters accepted by every list endpoint. */
export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0)
});

export type Pagination = z.infer<typeof PaginationSchema>;
