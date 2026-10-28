import { expect, test } from "vitest";
import { parseConfirmParams } from "./confirm";

const params = (query: string) => new URLSearchParams(query);

test("a signup confirmation link is accepted", () => {
  expect(parseConfirmParams(params("token_hash=abc123&type=email&next=/home"))).toEqual({
    tokenHash: "abc123",
    type: "email",
    next: "/home",
  });
});

test("next defaults to /home", () => {
  expect(parseConfirmParams(params("token_hash=abc123&type=signup"))?.next).toBe("/home");
});

test("an off-site next is replaced with /home", () => {
  expect(parseConfirmParams(params("token_hash=abc123&type=email&next=https://evil.com"))?.next).toBe("/home");
});

test("a missing token hash is rejected", () => {
  expect(parseConfirmParams(params("type=email"))).toBeNull();
});

test("an unknown type is rejected", () => {
  expect(parseConfirmParams(params("token_hash=abc123&type=admin"))).toBeNull();
});
