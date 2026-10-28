import { expect, test } from "vitest";
import { isValidUsername } from "./username";

test("isValidUsername follows the username rules", () => {
  expect(isValidUsername("eren_1")).toBe(true);
  expect(isValidUsername("Eren")).toBe(false);
  expect(isValidUsername("ab")).toBe(false);
});
