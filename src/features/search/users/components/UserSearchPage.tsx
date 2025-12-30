"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { EmptyState, QueryError, QueryLoading } from "@/components";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useUserSearch } from "../hooks/useUserSearch";
import { UserSearchResultCard } from "./UserSearchResultCard";

type UserSearchPageProps = {
  initialQuery: string;
};

const HITS_PER_PAGE = 20;

export function UserSearchPage({ initialQuery }: UserSearchPageProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState(initialQuery ?? "");
  const [activeQuery, setActiveQuery] = useState(initialQuery ?? "");

  useEffect(() => {
    setInputValue(initialQuery ?? "");
    setActiveQuery(initialQuery ?? "");
  }, [initialQuery]);

  const trimmedActiveQuery = activeQuery.trim();
  const searchResult = useUserSearch(trimmedActiveQuery, {
    hitsPerPage: HITS_PER_PAGE,
  });

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = inputValue.trim();
      setActiveQuery(trimmed);

      const params = new URLSearchParams();
      if (trimmed) params.set("query", trimmed);
      const qs = params.toString();
      router.replace(qs ? `/user/search?${qs}` : "/user/search");
    },
    [inputValue, router]
  );

  const headerSubtitle = useMemo(() => {
    if (!trimmedActiveQuery) {
      return "ابحث عن أصدقائك أو مستخدمين جدد على MYBOOK.";
    }
    if (searchResult.data?.total) {
      return `${searchResult.data.total.toLocaleString()} نتائج لـ "${trimmedActiveQuery}"`;
    }
    return `لا توجد نتائج لـ "${trimmedActiveQuery}" حتى الآن.`;
  }, [trimmedActiveQuery, searchResult.data?.total]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 pb-16">
      <header className="pt-6">
        <h1 className="text-3xl font-semibold text-foreground">
          بحث المستخدمين
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{headerSubtitle}</p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm sm:flex-row sm:items-center"
        >
          <Input
            type="search"
            placeholder="اكتب اسم المستخدم أو الاسم الكامل..."
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            aria-label="بحث عن المستخدمين"
          />
          <Button type="submit" className="sm:min-w-[160px]">
            بحث
          </Button>
        </form>
      </header>

      {!trimmedActiveQuery ? (
        <EmptyState
          title="ابدأ البحث عن الأشخاص"
          message="اكتب اسم شخص أو اسم مستخدم في مربع البحث بالأعلى لعرض النتائج."
        />
      ) : searchResult.isLoading ? (
        <QueryLoading message="جاري جلب المستخدمين..." />
      ) : searchResult.isError ? (
        <QueryError
          message={searchResult.error?.message || "تعذّر تحميل نتائج البحث."}
          onRetry={() => searchResult.refetch()}
        />
      ) : searchResult.data?.hits?.length ? (
        <ul className="space-y-4">
          {searchResult.data.hits.map((hit) => (
            <UserSearchResultCard key={hit.objectID} hit={hit} />
          ))}
        </ul>
      ) : (
        <EmptyState
          title="لم يتم العثور على نتائج"
          message="حاول تعديل كلمات البحث أو التأكد من الإملاء."
        />
      )}
    </div>
  );
}
