import { expect, test } from "vitest";
import { isOwnStoragePath, MAX_IMAGE_BYTES } from "./storage";

test("own folder paths are accepted", () => {
  expect(isOwnStoragePath("abc/x.png", "abc")).toBe(true);
});

test("a folder that only starts with the user id is rejected", () => {
  expect(isOwnStoragePath("abcd/x.png", "abc")).toBe(false);
});

test("path traversal is rejected", () => {
  expect(isOwnStoragePath("../abc/x.png", "abc")).toBe(false);
  expect(isOwnStoragePath("abc/../def/x.png", "abc")).toBe(false);
});

test("image limit is 5 MB", () => {
  expect(MAX_IMAGE_BYTES).toBe(5 * 1024 * 1024);
});
