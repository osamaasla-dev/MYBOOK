export type ProfileSession = {
  lastViewed?: Date;
  viewCount: number;
};

export function createProfileSession(): ProfileSession {
  return {
    viewCount: 0,
  };
}

export function incrementProfileView(session: ProfileSession): ProfileSession {
  return {
    ...session,
    viewCount: session.viewCount + 1,
    lastViewed: new Date(),
  };
}
