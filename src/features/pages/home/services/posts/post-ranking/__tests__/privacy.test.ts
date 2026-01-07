import { resolveEffectiveVisibility } from "../privacy";
import { Visibility, PostVisibilityPreference } from "@prisma/client";

describe("resolveEffectiveVisibility", () => {
  it("returns post visibility when preference is OVERRIDE", () => {
    expect(
      resolveEffectiveVisibility(
        Visibility.FRIENDS,
        PostVisibilityPreference.OVERRIDE,
        Visibility.PUBLIC
      )
    ).toBe(Visibility.FRIENDS);
  });

  it("falls back to author default visibility when preference is ACCOUNT_DEFAULT", () => {
    expect(
      resolveEffectiveVisibility(
        Visibility.FRIENDS,
        PostVisibilityPreference.ACCOUNT_DEFAULT,
        Visibility.PUBLIC
      )
    ).toBe(Visibility.PUBLIC);

    expect(
      resolveEffectiveVisibility(
        Visibility.PUBLIC,
        PostVisibilityPreference.ACCOUNT_DEFAULT,
        Visibility.FRIENDS
      )
    ).toBe(Visibility.FRIENDS);
  });
});
