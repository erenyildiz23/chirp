const UNIQUE_VIOLATION = "23505";

/**
 * Like/repost/follow are toggles: inserting a row that already exists (a double
 * click) leaves the state the user asked for, so it is not an error.
 */
export function isIdempotentSuccess(error: { code?: string } | null): boolean {
  return error === null || error.code === UNIQUE_VIOLATION;
}
