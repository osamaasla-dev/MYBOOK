import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  collapsedLines: number;
};

export function CollapsibleText({ text, collapsedLines }: Props) {
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
    <div className="rounded-2xl bg-muted/20 px-4 py-4">
      <div
        className="relative"
        style={
          isCollapsed
            ? { maxHeight: state.maxHeight, overflow: "hidden" }
            : undefined
        }
      >
        <p ref={textRef} dir="auto" className="whitespace-pre-wrap">
          {text}
        </p>

        {isCollapsed && (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-muted/80 to-transparent" />
        )}
      </div>

      {state.enabled && (
        <button
          type="button"
          className="cursor-pointer mt-2 px-1 text-sm font-semibold text-primary"
          onClick={() => setExpanded((p) => !p)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
