import { useCallback } from "react";
import { useToast } from "./useToast";

/** Clipboard helper. Returns { copyWithToast } which copies text and shows a toast on success. */
export default function useCopyToClipboard() {
  const { showToast } = useToast();

  const copyWithToast = useCallback(
    async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast("Copied to clipboard!");
        return true;
      } catch {
        return false;
      }
    },
    [showToast],
  );

  return { copyWithToast };
}
