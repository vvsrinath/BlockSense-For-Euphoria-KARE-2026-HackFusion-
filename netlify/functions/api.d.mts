/**
 * Types for the Netlify Function entry point.
 *
 * The function is deliberately plain JavaScript: Netlify bundles it on its own,
 * and it imports an already-built bundle, so there is nothing for the workspace
 * compiler to resolve. This declaration exists so the test that drives the
 * handler — the only way to catch Netlify's path rewriting before a deploy —
 * still type-checks, and so the handler's contract is written down.
 */

/** The subset of Netlify's event object the handler reads. */
export interface NetlifyEvent {
  httpMethod: string;
  path: string;
  rawUrl: string;
  headers: Record<string, string | undefined>;
  queryStringParameters: Record<string, string> | null;
  multiValueQueryStringParameters: Record<string, string[]> | null;
  body: string | null;
  isBase64Encoded: boolean;
}

/** Netlify's response envelope, as `serverless-http` produces it. */
export interface NetlifyResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export declare const handler: (event: NetlifyEvent, context: unknown) => Promise<NetlifyResult>;
export default handler;
