export type CurrentUser = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  role: "USER" | "ADMIN";
};
