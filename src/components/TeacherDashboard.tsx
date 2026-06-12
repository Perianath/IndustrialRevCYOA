import { Moon, RotateCcw, Sun, Volume2, VolumeX } from "lucide-react";
import type { TeacherSettings } from "../types/gameTypes";
import { categoryLabels, grammarPacks } from "../logic/grammarEngine";

type TeacherDashboardProps = {
  settings: TeacherSettings;
  onSettingsChange: (settings: TeacherSettings) => void;
  onBack: () => void;
  onReset: () => void;
};

export default function TeacherDashboard({ settings, onSettingsChange, onBack, onReset }: TeacherDashboardProps) {
  const pack = grammarPacks.find((candidate) => candidate.id === settings.packId) ?? grammarPacks[0];

  return (
    <main className="mx-auto grid max-w-6xl gap-5 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-signal-amber">Teacher Mode</p>
          <h1 className="text-3xl font-black text-harbor-900 dark:text-white">Classroom Controls</h1>
        </div>
        <button className="rounded-lg bg-harbor-700 px-4 py-2 font-black text-white" type="button" onClick={onBack}>
          Back to Menu
        </button>
      </header>
      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="panel">
          <h2 className="panel-title">Game Settings</h2>
          <label className="field-label">
            Grammar pack
            <select className="field-control" value={settings.packId} onChange={(event) => onSettingsChange({ ...settings, packId: event.target.value })}>
              {grammarPacks.map((grammarPack) => (
                <option key={grammarPack.id} value={grammarPack.id}>
                  {grammarPack.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            AI difficulty
            <select className="field-control" value={settings.aiDifficulty} onChange={(event) => onSettingsChange({ ...settings, aiDifficulty: event.target.value as TeacherSettings["aiDifficulty"] })}>
              <option value="cadet">Cadet - more random</option>
              <option value="captain">Captain - targets after hits</option>
              <option value="admiral">Admiral - smarter search pattern</option>
            </select>
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <button className="toggle-button" type="button" onClick={() => onSettingsChange({ ...settings, showExplanations: !settings.showExplanations })}>
              {settings.showExplanations ? "Explanations On" : "Explanations Off"}
            </button>
            <button className="toggle-button" type="button" onClick={() => onSettingsChange({ ...settings, soundEnabled: !settings.soundEnabled })}>
              {settings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />} Sound
            </button>
            <button className="toggle-button" type="button" onClick={() => onSettingsChange({ ...settings, theme: settings.theme === "light" ? "dark" : "light" })}>
              {settings.theme === "light" ? <Sun size={18} /> : <Moon size={18} />} Theme
            </button>
            <button className="toggle-button text-signal-coral" type="button" onClick={onReset}>
              <RotateCcw size={18} /> Reset Game
            </button>
          </div>
        </div>
        <div className="panel">
          <h2 className="panel-title">{pack.name}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">{pack.yearLevel}. {pack.prompts.length} binary prompts with no context-dependent answers.</p>
          <div className="mt-4 grid gap-2">
            {Object.entries(categoryLabels).map(([key, label]) => {
              const count = pack.prompts.filter((prompt) => prompt.category === key).length;
              if (!count) return null;
              return (
                <div className="flex justify-between rounded-md bg-harbor-50 px-3 py-2 text-sm dark:bg-slate-800" key={key}>
                  <span className="font-bold text-harbor-900 dark:text-white">{label}</span>
                  <span className="text-slate-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
