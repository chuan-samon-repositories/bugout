import { ShopifyConfig } from '../../config/ShopifyConfig';

export const DEFAULT_SHOPIFY_API_VERSION = '2026-07';

export interface ShopifyUserError {
  field?: string[] | null;
  message: string;
  code?: string | null;
}

interface GraphQLError {
  message: string;
}

interface GraphQLResponse<T> {
  data?: T | null;
  errors?: GraphQLError[];
}

export class ShopifyApiError extends Error {
  constructor(
    message: string,
    readonly details: { status?: number; errors?: readonly GraphQLError[]; userErrors?: readonly ShopifyUserError[] } = {},
  ) {
    super(message);
    this.name = 'ShopifyApiError';
  }
}

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

/** Minimal Storefront API GraphQL client shared by all Shopify adapters. */
export class ShopifyClient {
  readonly endpoint: string;
  private readonly headers: Record<string, string>;

  constructor(
    config: ShopifyConfig,
    private readonly fetchImpl?: FetchLike,
  ) {
    const domain = config.storeDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    this.endpoint = `https://${domain}/api/${config.apiVersion ?? DEFAULT_SHOPIFY_API_VERSION}/graphql.json`;
    this.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Shopify-Storefront-Access-Token': config.storefrontAccessToken,
    };
  }

  /** @throws ShopifyApiError on network failures, non-2xx responses and top-level GraphQL errors */
  async request<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const doFetch = this.fetchImpl ?? fetch;
    let response: Response;
    try {
      response = await doFetch(this.endpoint, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query, variables }),
      });
    } catch (error) {
      throw new ShopifyApiError(`Shopify request failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!response.ok) {
      throw new ShopifyApiError(`Shopify API responded with HTTP ${response.status} ${response.statusText}`.trim(), {
        status: response.status,
      });
    }

    let body: GraphQLResponse<T>;
    try {
      body = (await response.json()) as GraphQLResponse<T>;
    } catch {
      throw new ShopifyApiError('Shopify API returned invalid JSON', { status: response.status });
    }

    if (body.errors && body.errors.length > 0) {
      throw new ShopifyApiError(`Shopify GraphQL error: ${body.errors.map((error) => error.message).join('; ')}`, {
        status: response.status,
        errors: body.errors,
      });
    }
    if (!body.data) {
      throw new ShopifyApiError('Shopify API response has no data', { status: response.status });
    }
    return body.data;
  }
}

/** @throws ShopifyApiError when a mutation reports user errors */
export function assertNoUserErrors(operation: string, userErrors: readonly ShopifyUserError[] | null | undefined): void {
  if (userErrors && userErrors.length > 0) {
    throw new ShopifyApiError(`${operation} failed: ${userErrors.map((error) => error.message).join('; ')}`, { userErrors });
  }
}
