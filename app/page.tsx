// PROTOTYPE: three UI variants of the review home, switchable via ?variant=
// "Three variants of the code-review page on `/`, via ?variant=A|B|C."
"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { MyUIMessage } from "@/lib/types";
import { PrototypeSwitcher } from "@/app/components/PrototypeSwitcher";
import { VariantA, VARIANT_NAME as NAME_A } from "@/app/prototype-ui/VariantA";
import { VariantB, VARIANT_NAME as NAME_B } from "@/app/prototype-ui/VariantB";
import { VariantC, VARIANT_NAME as NAME_C } from "@/app/prototype-ui/VariantC";
import type { ReviewUiProps } from "@/app/prototype-ui/types";

const VARIANTS = [
  { key: "A", name: NAME_A },
  { key: "B", name: NAME_B },
  { key: "C", name: NAME_C },
] as const;

function HomePrototype() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("variant") ?? "A";
  const variant = VARIANTS.some((v) => v.key === raw) ? raw : "A";

  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop, error, clearError } =
    useChat<MyUIMessage>({
      transport: new DefaultChatTransport({ api: "/api/review" }),
    });

  const isBusy = status === "submitted" || status === "streaming";

  const props: ReviewUiProps = {
    input,
    setInput,
    messages,
    isBusy,
    error,
    onReview: () => {
      sendMessage(
        { text: input },
        {
          body: {
            customKey: "customValue",
          },
        },
      );
    },
    onStop: () => stop(),
    onClearError: () => clearError(),
  };

  return (
    <>
      {variant === "A" && <VariantA {...props} />}
      {variant === "B" && <VariantB {...props} />}
      {variant === "C" && <VariantC {...props} />}
      <PrototypeSwitcher variants={[...VARIANTS]} current={variant} />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<main className="p-8 text-sm opacity-50">Loading…</main>}>
      <HomePrototype />
    </Suspense>
  );
}
