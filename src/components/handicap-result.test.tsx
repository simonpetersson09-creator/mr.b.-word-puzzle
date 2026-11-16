import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HandicapResult } from "@/components/handicap-result";
import { setAppLanguage } from "@/lib/i18n";
import type { Round } from "@/lib/ord/engine";

// A finished round won on the fourth try is exactly par (0).
const parRound: Round = {
  date: "2026-11-16",
  answer: "KANEL",
  guesses: ["STOLE", "TRAPP", "GLASE", "KANEL"],
  language: "sv",
};
const rounds: Record<string, Round> = { "2026-11-16": parRound };

describe("HandicapResult word score row", () => {
  it("shows the per-word score by default, as on the result screen", () => {
    setAppLanguage("sv");
    render(<HandicapResult round={parRound} rounds={rounds} />);

    expect(screen.getByText("Ordpoäng")).toBeInTheDocument();
    expect(screen.getByText(/Par/)).toBeInTheDocument();
    expect(screen.getByText("HCP")).toBeInTheDocument();
  });

  it("omits the per-word score when showWordScore is false, as on the statistics page", () => {
    setAppLanguage("sv");
    render(
      <HandicapResult
        round={parRound}
        rounds={rounds}
        showWindow={false}
        showTrend
        showWordScore={false}
      />,
    );

    expect(screen.queryByText("Ordpoäng")).not.toBeInTheDocument();
    expect(screen.queryByText(/Par/)).not.toBeInTheDocument();
    expect(screen.getByText("HCP")).toBeInTheDocument();
  });
});
