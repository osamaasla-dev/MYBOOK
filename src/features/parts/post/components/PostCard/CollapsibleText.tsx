import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  collapsedLines: number;
  testId?: string;
};

export function CollapsibleText({ text, collapsedLines, testId }: Props) {
  const textRef = useRef<HTMLParagraphElement | null>(null);

  const [state, setState] = useState({
    enabled: false,
    maxHeight: 0,
  });

  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (!el || !text.trim()) {
      setState({ enabled: false, maxHeight: 0 });
      setExpanded(false);
      return;
    }

    const style = window.getComputedStyle(el);
    const lineHeight = parseFloat(style.lineHeight);

    if (!lineHeight) {
      setState({ enabled: false, maxHeight: 0 });
      return;
    }

    const maxHeight = lineHeight * collapsedLines;
    const shouldClamp = el.scrollHeight > maxHeight + 2;

    setState({
      enabled: shouldClamp,
      maxHeight,
    });

    setExpanded(false);
  }, [text, collapsedLines]);

  const isCollapsed = state.enabled && !expanded;

  return (
    <div className="rounded-2xl bg-muted/20 px-4 py-4" data-testid={testId}>
      <div
        className="relative"
        style={
          isCollapsed
            ? { maxHeight: state.maxHeight, overflow: "hidden" }
            : undefined
        }
        data-testid={`${testId}-content`}
      >
        <p
          ref={textRef}
          dir="auto"
          className="whitespace-pre-wrap"
          data-testid={`${testId}-text`}
          aria-label={isCollapsed ? "Collapsed text" : "Expanded text"}
        >
          {text}
        </p>

        {isCollapsed && (
          <span
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-muted/80 to-transparent"
            aria-hidden="true"
            data-testid={`${testId}-fade`}
          />
        )}
      </div>

      {state.enabled && (
        <button
          type="button"
          className="cursor-pointer mt-2 px-1 text-sm font-semibold text-primary"
          onClick={() => setExpanded((p) => !p)}
          data-testid={`${testId}-toggle`}
          aria-expanded={expanded}
          aria-controls={`${testId}-content`}
          aria-label={expanded ? "Show less text" : "Show more text"}
        >
          <span data-testid={`${testId}-toggle-text`}>
            {expanded ? "Show less" : "Show more"}
          </span>
        </button>
      )}
    </div>
  );
}
