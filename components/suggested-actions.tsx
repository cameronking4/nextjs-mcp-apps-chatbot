"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo } from "react";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "./elements/suggestion";
import type { VisibilityType } from "./visibility-selector";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
};

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {
  const suggestedActions = [
    // VP Demo: Multi-tool research workflow
    "Research NVDA: quote, 1Y chart, fundamentals, recent news, and upcoming earnings",
    // VP Demo: Portfolio building workflow  
    "Find undervalued tech stocks (P/E < 25, market cap > $100B) and create a watchlist",
    // VP Demo: Competitive analysis
    "Compare the Magnificent 7: AAPL, MSFT, GOOGL, AMZN, META, NVDA, TSLA on key metrics",
    // VP Demo: Morning briefing workflow
    "Morning briefing: market snapshot, top movers, and key earnings this week",
    // VP Demo: Sector deep dive
    "Tech sector analysis: screen top performers, show sentiment from latest news",
    // VP Demo: Investment thesis
    "Investment thesis for AAPL: fundamentals, ratios, compare to MSFT and GOOGL",
  ];

  return (
    <div
      className="grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-3"
      data-testid="suggested-actions"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          initial={{ opacity: 0, y: 20 }}
          key={suggestedAction}
          transition={{ delay: 0.05 * index }}
        >
          <Suggestion
            className="h-auto w-full whitespace-normal p-3 text-left"
            onClick={(suggestion) => {
              window.history.pushState({}, "", `/chat/${chatId}`);
              sendMessage({
                role: "user",
                parts: [{ type: "text", text: suggestion }],
              });
            }}
            suggestion={suggestedAction}
          >
            {suggestedAction}
          </Suggestion>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }

    return true;
  }
);
