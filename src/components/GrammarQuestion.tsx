import type { GrammarPrompt } from "../types/gameTypes";

type GrammarQuestionProps = {
  prompt: GrammarPrompt;
  onAnswer: (answer: "yes" | "no") => void;
};

export default function GrammarQuestion({ prompt, onAnswer }: GrammarQuestionProps) {
  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-harbor-500">Does this phrase need a hyphen?</p>
        <h2 className="mt-2 rounded-lg bg-harbor-50 px-5 py-4 text-center text-3xl font-black text-harbor-900">
          {prompt.phrase}
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          className="rounded-lg border border-signal-mint bg-signal-mint px-5 py-4 text-lg font-black text-white shadow-soft transition hover:brightness-95"
          type="button"
          onClick={() => onAnswer("yes")}
        >
          YES - Needs Hyphen
        </button>
        <button
          className="rounded-lg border border-harbor-700 bg-white px-5 py-4 text-lg font-black text-harbor-900 transition hover:bg-harbor-50"
          type="button"
          onClick={() => onAnswer("no")}
        >
          NO - No Hyphen
        </button>
      </div>
    </div>
  );
}
