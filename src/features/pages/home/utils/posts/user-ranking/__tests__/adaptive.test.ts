import {
  determineCandidateCount,
  determineFinalSelectionCount,
} from "../adaptive";

describe("determineCandidateCount", () => {
  it("returns minimum when there are no relations", () => {
    expect(determineCandidateCount(0)).toBe(40);
  });

  it("scales logarithmically while respecting max cap", () => {
    expect(determineCandidateCount(1_000)).toBeGreaterThan(
      determineCandidateCount(10)
    );
    expect(determineCandidateCount(100_000_000)).toBe(500);
  });
});

describe("determineFinalSelectionCount", () => {
  it("returns minimum when no candidates provided", () => {
    expect(determineFinalSelectionCount(0)).toBe(12);
  });

  it("scales proportionally with candidate count and clamps to max", () => {
    expect(determineFinalSelectionCount(200)).toBeGreaterThan(
      determineFinalSelectionCount(50)
    );
    expect(determineFinalSelectionCount(1_000)).toBe(60);
  });
});
