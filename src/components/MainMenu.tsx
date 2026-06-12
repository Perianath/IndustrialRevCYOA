import { Bot, GraduationCap, HelpCircle, Users } from "lucide-react";
import type { GameMode, TeacherSettings } from "../types/gameTypes";
import { grammarPacks } from "../logic/grammarEngine";

type MainMenuProps = {
  settings: TeacherSettings;
  onStart: (mode: GameMode) => void;
  onTeacher: () => void;
  onHowToPlay: () => void;
};

export default function MainMenu({ settings, onStart, onTeacher, onHowToPlay }: MainMenuProps) {
  const pack = grammarPacks.find((candidate) => candidate.id === settings.packId) ?? grammarPacks[0];

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl content-center gap-8 px-4 py-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid content-center gap-5">
          <p className="text-sm font-black uppercase text-signal-amber">Year 8 English strategy game</p>
          <h1 className="max-w-3xl text-5xl font-black leading-tight text-harbor-900 dark:text-white md:text-6xl">
            Grammar Battleships
          </h1>
          <p className="max-w-2xl text-lg text-slate-700 dark:text-slate-300">
            Sink the fleet by combining deduction with accurate grammar decisions. Every attack is unlocked by deciding whether a phrase needs a hyphen.
          </p>
          <div className="flex flex-wrap gap-2 text-sm font-bold text-harbor-900 dark:text-harbor-50">
            <span className="rounded-full bg-white px-3 py-2 shadow-sm dark:bg-slate-800">6x6 board</span>
            <span className="rounded-full bg-white px-3 py-2 shadow-sm dark:bg-slate-800">100+ prompts</span>
            <span className="rounded-full bg-white px-3 py-2 shadow-sm dark:bg-slate-800">Hot-seat or AI</span>
          </div>
        </div>
        <div className="rounded-lg border border-white/70 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-slate-900">
          <p className="text-sm font-black uppercase text-harbor-500">Active grammar pack</p>
          <h2 className="mt-1 text-2xl font-black text-harbor-900 dark:text-white">{pack.name}</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{pack.description}</p>
          <div className="mt-5 grid gap-3">
            <button className="menu-action bg-harbor-700 text-white hover:bg-harbor-900" type="button" onClick={() => onStart("ai")}>
              <Bot size={22} /> Play vs AI
            </button>
            <button className="menu-action bg-white text-harbor-900 ring-1 ring-harbor-200 hover:bg-harbor-50 dark:bg-slate-800 dark:text-white dark:ring-white/10" type="button" onClick={() => onStart("hotseat")}>
              <Users size={22} /> 2 Player Hot Seat
            </button>
            <button className="menu-action bg-white text-harbor-900 ring-1 ring-harbor-200 hover:bg-harbor-50 dark:bg-slate-800 dark:text-white dark:ring-white/10" type="button" onClick={onTeacher}>
              <GraduationCap size={22} /> Teacher Mode
            </button>
            <button className="menu-action bg-white text-harbor-900 ring-1 ring-harbor-200 hover:bg-harbor-50 dark:bg-slate-800 dark:text-white dark:ring-white/10" type="button" onClick={onHowToPlay}>
              <HelpCircle size={22} /> How to Play
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
