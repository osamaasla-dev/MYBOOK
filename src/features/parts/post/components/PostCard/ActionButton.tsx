import { Button } from "@/components/ui/button";

type ActionButtonProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
};

export function ActionButton({ icon: Icon, label }: ActionButtonProps) {
  return (
    <Button
      type="button"
      className="bg-transparent flex flex-1 items-center justify-center rounded-md px-2 py-2 text-xs text-muted-foreground hover:bg-secondary"
    >
      <Icon className="size-4" aria-hidden="true" />
      <span>{label}</span>
    </Button>
  );
}
