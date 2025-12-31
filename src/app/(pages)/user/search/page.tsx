import { SearchResultsPage } from "@/features/parts/search/page/SearchResultsPage";

type SearchPageProps = {
  searchParams?: {
    query?: string;
  };
};

export default function UserSearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams?.query ?? "";

  return <SearchResultsPage initialQuery={query} />;
}
