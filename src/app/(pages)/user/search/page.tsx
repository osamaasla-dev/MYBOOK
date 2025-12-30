import { UserSearchPage } from "@/features/search/users/components/UserSearchPage";

type SearchRouteProps = {
  searchParams?: { query?: string };
};

export default function UserSearchRoute({ searchParams }: SearchRouteProps) {
  const initialQuery =
    typeof searchParams?.query === "string" ? searchParams.query : "";

  return <UserSearchPage initialQuery={initialQuery} />;
}
