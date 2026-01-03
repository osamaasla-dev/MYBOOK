import { useMemo } from "react";
import { RELATION_SECTIONS } from "../constants/tabs";

export function useRelationTabs() {
  return useMemo(() => RELATION_SECTIONS, []);
}
