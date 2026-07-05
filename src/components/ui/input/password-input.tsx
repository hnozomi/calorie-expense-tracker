"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils";
import { Input } from "./input";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;

/** Password input with a show/hide visibility toggle */
const PasswordInput = ({ className, ...props }: PasswordInputProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={isVisible ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <button
        type="button"
        aria-label={isVisible ? "パスワードを隠す" : "パスワードを表示"}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => setIsVisible((prev) => !prev)}
      >
        {isVisible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};

export { PasswordInput };
