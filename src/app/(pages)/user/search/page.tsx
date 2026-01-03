import { SearchResultsPage } from "@/features/pages/search/page/SearchResultsPage";
import { getUserSearchPageMetadata } from "@/features/pages/search/page/userSearchMeta";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams?: Promise<{
    query?: string;
  }>;
};

async function UserSearchPageInner({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.query ?? "";

  return <SearchResultsPage initialQuery={query} />;
}

export default function UserSearchPage(props: SearchPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserSearchPageInner {...props} />
    </Suspense>
  );
}

export async function generateMetadata(props: SearchPageProps) {
  const query = (await props.searchParams)?.query;
  return getUserSearchPageMetadata(query);
}
