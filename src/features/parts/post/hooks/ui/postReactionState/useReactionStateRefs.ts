import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";

import type { PostReactionType } from "../../../constants/reactions";
import type { ReactionSummary } from "../../../utils/reaction";

export type ReactionStateRefs = {
  actionIdRef: MutableRefObject<number>;
  resolvedActionIdRef: MutableRefObject<number>;
  committedReactionRef: MutableRefObject<PostReactionType | null>;
  committedSummaryRef: MutableRefObject<ReactionSummary | null | undefined>;
  optimisticReaction: PostReactionType | null;
  setOptimisticReaction: Dispatch<SetStateAction<PostReactionType | null>>;
  optimisticSummary: ReactionSummary | null | undefined;
  setOptimisticSummary: Dispatch<
    SetStateAction<ReactionSummary | null | undefined>
  >;
};

export function useReactionStateRefs(
  initialReaction: PostReactionType | null,
  initialSummary: ReactionSummary | null | undefined
): ReactionStateRefs {
  const actionIdRef = useRef(0);
  const resolvedActionIdRef = useRef(0);
  const committedReactionRef = useRef<PostReactionType | null>(
    initialReaction ?? null
  );
  const committedSummaryRef = useRef<ReactionSummary | null | undefined>(
    initialSummary
  );
  const [optimisticReaction, setOptimisticReaction] =
    useState<PostReactionType | null>(initialReaction ?? null);
  const [optimisticSummary, setOptimisticSummary] = useState<
    ReactionSummary | null | undefined
  >(initialSummary);

  useEffect(() => {
    if (actionIdRef.current !== resolvedActionIdRef.current) {
      return;
    }

    committedReactionRef.current = initialReaction ?? null;
    committedSummaryRef.current = initialSummary;
    setOptimisticReaction(initialReaction ?? null);
    setOptimisticSummary(initialSummary);
  }, [initialReaction, initialSummary]);

  return {
    actionIdRef,
    resolvedActionIdRef,
    committedReactionRef,
    committedSummaryRef,
    optimisticReaction,
    setOptimisticReaction,
    optimisticSummary,
    setOptimisticSummary,
  };
}
