declare module "lodash.debounce" {
  type DebounceOptions = {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  };

  export default function debounce<T extends (...args: never[]) => unknown>(
    fn: T,
    wait?: number,
    options?: DebounceOptions
  ): T & {
    cancel(): void;
    flush(): ReturnType<T>;
    pending?(): boolean;
  };
}
