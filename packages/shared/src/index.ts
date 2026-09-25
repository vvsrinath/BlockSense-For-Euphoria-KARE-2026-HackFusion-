/**
 * Public surface of `@blocksense/shared`.
 *
 * Everything exported here is considered stable API for the rest of the
 * monorepo. If a shape is needed by two or more packages, it belongs here
 * rather than being redefined in each consumer.
 */

// Domain types
export * from './types';

// Validation schemas (zod)
export * from './schemas';

// Constants
export * from './constants';

// Utilities
export * from './utils';
