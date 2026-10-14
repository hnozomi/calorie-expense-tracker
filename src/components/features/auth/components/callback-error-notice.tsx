"use client";
// Client because it reads ?error= from the URL (logic lives in useCallbackError)

import { MailWarning } from "lucide-react";
import { useCallbackError } from "../hooks/use-callback-error";

// The auth callback's failure, shown above the login form
export const CallbackErrorNotice = () => {
  const message = useCallbackError();
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3">
      <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="text-sm text-amber-700 dark:text-amber-300">{message}</p>
    </div>
  );
};
