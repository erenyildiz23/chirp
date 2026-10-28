import { expect, test } from "vitest";
import { isIdempotentSuccess } from "./idempotent";

test("no error is a success", () => {
  expect(isIdempotentSuccess(null)).toBe(true);
});

test("a duplicate row (double click) counts as success", () => {
  expect(isIdempotentSuccess({ code: "23505" })).toBe(true);
});

test("a permission error is a real failure", () => {
  expect(isIdempotentSuccess({ code: "42501" })).toBe(false);
});
