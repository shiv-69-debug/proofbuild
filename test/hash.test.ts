import { describe, expect, it } from "vitest";
import { sha256Bytes, stableJson } from "../src/lib/hash.js";

describe("hash utilities", () => {
  it("creates stable JSON regardless of object insertion order", () => {
    expect(stableJson({ z: 1, a: { d: 2, b: 3 } })).toBe(stableJson({ a: { b: 3, d: 2 }, z: 1 }));
  });

  it("creates a standard SHA-256 digest", () => {
    expect(sha256Bytes("proofbuild")).toBe("5b2997771b01051408aa6d848fc1936c37901bd38f15a6e777f0f9e9ce2943e4");
  });
});
