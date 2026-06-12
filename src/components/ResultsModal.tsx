import type { PlayerState } from "../types/gameTypes";

type ResultsModalProps = {
  winner: PlayerState;
  players: PlayerState[];
  onMenu: () => void;
  onReplay: () => void;
};

export default function ResultsModal({ winner, players, onMenu, onReplay }: ResultsModalProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <section className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-soft dark:bg-slate-900">
        <p className="text-sm font-black uppercase text-signal-amber">Battle complete</p>
        <h1 className="text-4xl font-black text-harbor-900 dark:text-white">{winner.name} wins</h1>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {players.map((player) => {
            const accuracy = player.stats.shotsFired ? Math.round((player.stats.hits / player.stats.shotsFired) * 100) : 0;
            const grammarAccuracy = player.stats.grammarAttempts ? Math.round((player.stats.correctGrammar / player.stats.grammarAttempts) * 100) : 0;
            return (
              <article className="rounded-lg border border-harbor-100 bg-harbor-50 p-4 dark:border-white/10 dark:bg-slate-800" key={player.id}>
                <h2 className="text-xl font-black text-harbor-900 dark:text-white">{player.name}</h2>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <Stat label="Shots" value={player.stats.shotsFired} />
                  <Stat label="Accuracy" value={`${accuracy}%`} />
                  <Stat label="Grammar" value={`${grammarAccuracy}%`} />
                  <Stat label="Hits" value={player.stats.hits} />
                  <Stat label="Misses" value={player.stats.misses} />
                  <Stat label="Ships sunk" value={player.ships.filter((ship) => ship.sunk).length} />
                </dl>
              </article>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button className="rounded-lg border border-harbor-700 px-4 py-2 font-black text-harbor-900 dark:border-white/20 dark:text-white" type="button" onClick={onMenu}>
            Main Menu
          </button>
          <button className="rounded-lg bg-harbor-700 px-4 py-2 font-black text-white" type="button" onClick={onReplay}>
            Play Again
          </button>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-white p-2 dark:bg-slate-900">
      <dt className="text-xs font-bold uppercase text-slate-500">{label}</dt>
      <dd className="text-lg font-black text-harbor-900 dark:text-white">{value}</dd>
    </div>
  );
}
