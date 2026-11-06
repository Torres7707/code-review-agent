import type { MyUIMessage } from "@/lib/types";

/** Shared chat state for throwaway UI variants. PROTOTYPE — not production API. */
export type ReviewUiProps = {
  input: string;
  setInput: (value: string) => void;
  messages: MyUIMessage[];
  isBusy: boolean;
  error: Error | undefined;
  onReview: () => void;
  onStop: () => void;
  onClearError: () => void;
};
