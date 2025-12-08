import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { HomePage } from "@/features/pages/home/page/HomePage";

export default async function UserDirectoryPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      name: true,
    },
  });

  if (!users.length) {
    return (
      <section className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-white)] p-6 text-center text-[var(--color-muted-foreground)]">
        لا يوجد مستخدمون بعد.
      </section>
    );
  }

  return (
    // <section className="space-y-4">
    //   <ul className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)] bg-[var(--color-white)]">
    //     {users.map((user) => (
    //       <li
    //         key={user.id}
    //         className="p-4 hover:bg-[var(--color-secondary)]/40"
    //       >
    //         <Link
    //           href={`/user/profile/${user.username}`}
    //           className="flex flex-col gap-1 text-[var(--color-foreground)] transition hover:text-[var(--color-primary)]"
    //         >
    //           @{user.username}
    //         </Link>
    //       </li>
    //     ))}
    //   </ul>
    // </section>
    <HomePage />
  );
}
