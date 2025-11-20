import { ServerSession } from "@/utils/session";

export type ViewerSession = {
  viewerId: string | null;
  isAuthenticated: boolean;
};

export async function getViewerSession(): Promise<ViewerSession> {
  const session = await ServerSession();
  const viewerId = session?.user?.id ?? null;

  return {
    viewerId,
    isAuthenticated: Boolean(viewerId),
  };
}
