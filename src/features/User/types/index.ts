export type CurrentUser = {
  name: string;
  username: string;
  avatarUrl: string | null;
  role: "USER" | "ADMIN";
};
