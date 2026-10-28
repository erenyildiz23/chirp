import { expect, test } from "vitest";
import { safeNext } from "./redirect";

test.each([
  ["/home", "/home"],
  ["/ada/status/3", "/ada/status/3"],
  [null, "/home"],
  ["", "/home"],
  ["https://evil.com", "/home"],
  ["//evil.com", "/home"],
  ["/\\evil.com", "/home"],
  ["home", "/home"],
])("safeNext(%s) = %s", (next, expected) => {
  expect(safeNext(next)).toBe(expected);
});
