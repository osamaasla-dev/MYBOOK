"use client";

import type { QueryClient } from "@tanstack/react-query";

import {
  HOME_FEED_QUERY_KEY,
  type HomeFeedQueryData,
} from "@/features/pages/home/hooks/useHomeFeed";

import type { CreatePostResponseData } from "../../types";

export type UpdateMutationContext = {
  previousHomeFeed?: HomeFeedQueryData;
};

export async function cancelHomeFeedQuery(queryClient: QueryClient) {
  await queryClient.cancelQueries({ queryKey: HOME_FEED_QUERY_KEY });
}

export function updatePostInFeedOptimistically(
  queryClient: QueryClient,
  postId: string,
  updatedPostData: CreatePostResponseData
) {
  queryClient.setQueryData<HomeFeedQueryData | undefined>(
    HOME_FEED_QUERY_KEY,
    (current) => {
      if (!current) return current;

      // Find and update the post in all pages
      const updatedPages = current?.pages.map((page) => ({
        ...page,
        posts: page?.posts.map((post) =>
          post.postId === postId
            ? {
                ...post,
                content: {
                  text: updatedPostData.content,
                  richText: null,
                  media: updatedPostData?.media.map((m) => ({
                    id: m.id,
                    url: m.url,
                    type: m.type.toUpperCase() as
                      | "IMAGE"
                      | "VIDEO"
                      | "AUDIO"
                      | "DOCUMENT",
                  })),
                  linkPreview: null,
                },
                visibility: updatedPostData.visibility,
                visibilityPreference: updatedPostData.visibilityPreference,
                updatedAt: new Date(), // Update timestamp
              }
            : post
        ),
      }));

      const updatedPosts = updatedPages.flatMap((page) => page.posts);
      console.log(updatedPages);
      return { ...current, pages: updatedPages, posts: updatedPosts };
    }
  );
}
