import type { RelationListItem } from "../../../types";
import { RelationListItem as RelationListItemRow } from "./RelationListItem";

type RelationsListItemsProps = {
  items: RelationListItem[];
  testId?: string;
};

export function RelationsListItems({
  items,
  testId = "relations-list-items",
}: RelationsListItemsProps) {
  return (
    <ul
      role="list"
      className="divide-y divide-border/70"
      aria-label={`Relations items (${items.length} total)`}
      data-testid={testId}
    >
      {items.map((item, index) => (
        <RelationListItemRow
          key={`${item.tab}-${item.id}`}
          item={item}
          testId={`${testId}-item-${index + 1}`}
          index={index}
        />
      ))}
    </ul>
  );
}
