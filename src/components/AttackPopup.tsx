import GrammarQuestion from "./GrammarQuestion";
import type { AttackOutcome, PendingAttack } from "../types/gameTypes";
import { coordinateLabel } from "../logic/battleshipEngine";

type AttackPopupProps = {
  pending: PendingAttack | null;
  outcome: AttackOutcome | null;
  showExplanation: boolean;
  onAnswer: (answer: "yes" | "no") => void;
  onContinue: () => void;
};

export default function AttackPopup({ pending, outcome, showExplanation, onAnswer, onContinue }: AttackPopupProps) {
  if (!pending && !outcome) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-lg border border-white/40 bg-white p-6 shadow-soft">
        {pending && !outcome ? (
          <>
            <p className="mb-3 text-sm font-black uppercase text-harbor-500">
              Attack coordinate {coordinateLabel(pending.coordinate)}
            </p>
            <GrammarQuestion prompt={pending.prompt} onAnswer={onAnswer} />
          </>
        ) : null}
        {outcome ? (
          <div className="grid gap-4">
            <p className="text-sm font-black uppercase text-harbor-500">{coordinateLabel(outcome.coordinate)} result</p>
            <h2 className="text-3xl font-black text-harbor-900">
              {outcome.result === "blocked"
                ? "Grammar miss"
                : outcome.result === "sunk"
                  ? `${outcome.sunkShip?.type} sunk`
                  : outcome.result.toUpperCase()}
            </h2>
            <p className="rounded-lg bg-harbor-50 p-4 text-harbor-900">
              {outcome.grammarCorrect ? "Correct grammar answer. The attack proceeded." : "Incorrect grammar answer. The attack became an automatic miss."}
            </p>
            {showExplanation ? <p className="text-sm text-slate-700">{outcome.explanation}</p> : null}
            <button
              className="justify-self-end rounded-lg bg-harbor-700 px-5 py-3 font-black text-white hover:bg-harbor-900"
              type="button"
              onClick={onContinue}
            >
              Continue
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
