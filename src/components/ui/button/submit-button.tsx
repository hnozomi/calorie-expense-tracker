import type { ComponentProps } from "react";
import { Button } from "./button";

type Props = ComponentProps<typeof Button> & {
  isPending: boolean;
};

/** The form's submit button: shows a spinner and 保存中... while the save runs, and cannot be pressed twice */
export const SubmitButton = ({ isPending, children, ...props }: Props) => (
  <Button type="submit" disabled={isPending} {...props}>
    {isPending ? (
      <span className="flex items-center gap-2">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
        保存中...
      </span>
    ) : (
      children
    )}
  </Button>
);
