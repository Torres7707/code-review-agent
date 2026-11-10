import { describe, expect, it } from "vitest";
import { isValidOwner, isValidPrNumber, isValidRepo, repoPath } from "@/lib/github";

describe("GitHub input validation", () => {
  it("accepts real owner and repo names", () => {
    expect(isValidOwner("vercel")).toBe(true);
    expect(isValidOwner("Torres7707")).toBe(true);
    expect(isValidRepo("next.js")).toBe(true);
    expect(isValidRepo("code_review-agent")).toBe(true);
  });

  it("rejects values that could change the API path", () => {
    for (const owner of ["", "a/b", "../user", "-lead", "a?b", "a b"]) {
      expect(isValidOwner(owner)).toBe(false);
    }
    for (const repo of ["", ".", "..", "a/b", "r?x=1", "r#1"]) {
      expect(isValidRepo(repo)).toBe(false);
    }
  });

  it("accepts only positive PR numbers", () => {
    expect(isValidPrNumber("42")).toBe(true);
    expect(isValidPrNumber("0")).toBe(false);
    expect(isValidPrNumber("1e3")).toBe(false);
    expect(isValidPrNumber("../1")).toBe(false);
  });

  it("encodes path segments", () => {
    expect(repoPath("o", "r.js")).toBe("/repos/o/r.js");
  });
});
