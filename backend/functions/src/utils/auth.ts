import { CognitoJwtVerifier } from 'aws-jwt-verify';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: 'id',
  clientId: process.env.COGNITO_CLIENT_ID!,
});

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export async function verifyAuth(event: APIGatewayProxyEvent): Promise<string> {
  const authHeader =
    event.headers['Authorization'] ?? event.headers['authorization'] ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) throw new ApiError(401, 'Unauthenticated');

  const payload = await verifier.verify(token);
  return payload.sub;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

export function corsOk(): APIGatewayProxyResult {
  return { statusCode: 204, headers: CORS_HEADERS, body: '' };
}

export function ok(data: unknown): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}

export function apiError(err: unknown): APIGatewayProxyResult {
  if (err instanceof ApiError) {
    return {
      statusCode: err.statusCode,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
  console.error('[Sprout] Unhandled error:', err);
  return {
    statusCode: 500,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Internal server error' }),
  };
}

export function body<T>(event: APIGatewayProxyEvent): T {
  try {
    return JSON.parse(event.body ?? '{}') as T;
  } catch {
    throw new ApiError(400, 'Invalid JSON body');
  }
}

export function pathParam(event: APIGatewayProxyEvent, name: string): string {
  const val = event.pathParameters?.[name];
  if (!val) throw new ApiError(400, `Missing path parameter: ${name}`);
  return val;
}
