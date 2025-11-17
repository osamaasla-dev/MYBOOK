import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import { useSession } from "next-auth/react";

export async function ServerSession() {
  return await getServerSession(authOptions);
}

export function ClientSession() {
  return useSession();
}
