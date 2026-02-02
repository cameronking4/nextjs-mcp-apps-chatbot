"use client";

import { CheckCircle2, MinusCircle, Terminal } from "lucide-react";
import type { ParsedQuestionnaireAnswer } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface QuestionnaireAnswersCardProps {
  answers: ParsedQuestionnaireAnswer[];
  className?: string;
}

export function QuestionnaireAnswersCard({
  answers,
  className,
}: QuestionnaireAnswersCardProps) {
  return (
    <div className="flex w-full justify-end">
      <div
        className={cn(
          "w-fit max-w-[min(100%,420px)] overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-lg",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-zinc-700 bg-zinc-800 px-4 py-2.5">
          <Terminal className="size-4 text-emerald-400" />
          <span className="font-mono font-medium text-sm text-zinc-200">
            Your Responses
          </span>
        </div>

        {/* Answers List */}
        <div className="divide-y divide-zinc-800">
          {answers.map((item, index) => (
            <div
              className="flex items-start gap-3 px-4 py-3"
              key={`answer-${index}`}
            >
              {/* Icon */}
              <div className="mt-0.5 shrink-0">
                {item.isSkipped ? (
                  <MinusCircle className="size-4 text-zinc-500" />
                ) : (
                  <CheckCircle2 className="size-4 text-emerald-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-mono text-xs text-zinc-400">
                  {item.question}
                </span>
                <span
                  className={cn("font-mono text-sm", {
                    "text-zinc-500 italic": item.isSkipped,
                    "text-zinc-100": !item.isSkipped,
                  })}
                >
                  {item.isOther
                    ? item.answer.replace("Other: ", "")
                    : item.answer}
                  {item.isOther && (
                    <span className="ml-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
                      custom
                    </span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
