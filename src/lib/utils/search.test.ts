import { expect, test } from "vitest";
import { escapeLike } from "./search";

test("escapeLike escapes LIKE wildcards and backslashes", () => {
  expect(escapeLike("50%_off")).toBe("50\\%\\_off");
  expect(escapeLike("a\\b")).toBe("a\\\\b");
});
