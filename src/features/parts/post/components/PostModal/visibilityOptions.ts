import { Visibility, PostVisibilityPreference } from "@prisma/client";
import { Globe, Lock, Settings, UserCheck, Users } from "lucide-react";

export type VisibilityOption = {
  value: "ACCOUNT" | "PUBLIC" | "FRIENDS" | "FRIENDS_FOLLOWERS" | "ONLY_ME";
  label: string;
  description: string;
  icon: typeof Globe;
  selection: {
    visibility: Visibility;
    visibilityPreference: PostVisibilityPreference;
  };
};

export const VISIBILITY_OPTIONS: readonly VisibilityOption[] = [
  {
    value: "ACCOUNT",
    label: "Account defaults",
    description: "Respect your account privacy settings",
    icon: Settings,
    selection: {
      visibility: Visibility.PUBLIC,
      visibilityPreference: PostVisibilityPreference.ACCOUNT_DEFAULT,
    },
  },
  {
    value: "PUBLIC",
    label: "Public",
    description: "Anyone on or off the platform can see this",
    icon: Globe,
    selection: {
      visibility: Visibility.PUBLIC,
      visibilityPreference: PostVisibilityPreference.OVERRIDE,
    },
  },
  {
    value: "FRIENDS",
    label: "Friends",
    description: "Only your friends will see this",
    icon: UserCheck,
    selection: {
      visibility: Visibility.FRIENDS,
      visibilityPreference: PostVisibilityPreference.OVERRIDE,
    },
  },
  {
    value: "FRIENDS_FOLLOWERS",
    label: "Friends & followers",
    description: "Friends plus people who follow you",
    icon: Users,
    selection: {
      visibility: Visibility.FRIENDS_FOLLOWERS,
      visibilityPreference: PostVisibilityPreference.OVERRIDE,
    },
  },
  {
    value: "ONLY_ME",
    label: "Only me",
    description: "Visible just for you",
    icon: Lock,
    selection: {
      visibility: Visibility.ONLY_ME,
      visibilityPreference: PostVisibilityPreference.OVERRIDE,
    },
  },
] as const;
