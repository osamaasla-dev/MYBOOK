import { ServerSession } from "@/utils/session";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await ServerSession();
  if (session?.user?.role === "USER") {
    return redirect("/user");
  }
  return redirect("/signup");
}
