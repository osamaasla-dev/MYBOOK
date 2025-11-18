export type CurrentUser = {
  username: string;
  avatarUrl: string | null;
  role: "USER" | "ADMIN";
};
