import { apiPostR } from "@/lib/api";

import type { CreatePostInput } from "../schemas";
import type { CreatePostResponseData } from "../types";

const CREATE_POST_ENDPOINT = "/post/create";

export async function submitCreatePost(
  input: CreatePostInput
): Promise<CreatePostResponseData> {
  const { data } = await apiPostR<CreatePostResponseData>(
    CREATE_POST_ENDPOINT,
    input
  );
  return data;
}
