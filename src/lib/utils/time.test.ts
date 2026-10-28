import { expect, test } from "vitest";
import { formatRelative } from "./time";

const now = new Date("2026-10-28T12:00:00Z");

test.each([
  ["2026-10-28T11:59:30Z", "now"],
  ["2026-10-28T11:55:00Z", "5m"],
  ["2026-10-28T09:00:00Z", "3h"],
  ["2026-10-02T12:00:00Z", "Oct 2"],
  ["2024-10-02T12:00:00Z", "Oct 2, 2024"],
])("formatRelative(%s) = %s", (date, expected) => {
  expect(formatRelative(date, now)).toBe(expected);
});
