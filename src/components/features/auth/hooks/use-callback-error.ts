import { useSearchParams } from "next/navigation";

const CALLBACK_ERROR_MESSAGES: Record<string, string> = {
  confirmation_failed:
    "確認リンクが無効か期限切れです。ログインするか、新規登録をやり直してください",
};

// The message for ?error= set by the auth callback, or null
export const useCallbackError = (): string | null => {
  const key = useSearchParams().get("error");
  return key ? (CALLBACK_ERROR_MESSAGES[key] ?? null) : null;
};
