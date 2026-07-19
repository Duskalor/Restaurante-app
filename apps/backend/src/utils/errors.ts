export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

export function statusOf(error: unknown, fallback = 500): number {
  if (error instanceof HttpError) return error.statusCode;
  return fallback;
}

export function messageOf(error: unknown): string | undefined {
  if (error instanceof Error) return error.message;
  return undefined;
}

export function isPrismaError(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === code
  );
}
