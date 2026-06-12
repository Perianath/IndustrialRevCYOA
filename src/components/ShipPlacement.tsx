import { RotateCcw, Shuffle, Trash2 } from "lucide-react";
import { useState } from "react";
import GameBoard from "./GameBoard";
import {
  allShipTemplates,
  canPlaceShip,
  getCellsForPlacement,
  randomiseFleet,
  removeShip
} from "../logic/battleshipEngine";
import type { Coordinate, Orientation, PlayerState } from "../types/gameTypes";

type ShipPlacementProps = {
  player: PlayerState;
  onPlayerChange: (player: PlayerState) => void;
  onPlaceShip: (coordinate: Coordinate, orientation: Orientation, template: { id: string; type: "Battleship" | "Cruiser" | "Destroyer"; size: number }) => void;
  onDone: () => void;
};

export default function ShipPlacement({ player, onPlayerChange, onPlaceShip, onDone }: ShipPlacementProps) {
  const templates = allShipTemplates();
  const nextTemplate = templates.find((template) => !player.ships.some((ship) => ship.id === template.id));
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  const [hovered, setHovered] = useState<Coordinate | null>(null);
  const previewCells = hovered && nextTemplate ? getCellsForPlacement(hovered, nextTemplate.size, orientation) : [];
  const invalidPreview = hovered && nextTemplate ? !canPlaceShip(player.board, hovered, nextTemplate.size, orientation) : false;

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(320px,0.95fr)_minmax(280px,0.55fr)]">
      <div className="rounded-lg border border-harbor-100 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-slate-900">
        <GameBoard
          board={player.board}
          revealShips
          previewCells={previewCells}
          invalidPreview={Boolean(invalidPreview)}
          onCellHover={setHovered}
          onCellClick={(coordinate) => nextTemplate && onPlaceShip(coordinate, orientation, nextTemplate)}
        />
      </div>
      <aside className="grid content-start gap-4">
        <div>
          <p className="text-sm font-black uppercase text-signal-amber">Ship placement</p>
          <h2 className="text-2xl font-black text-harbor-900 dark:text-white">{player.name}</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Ships can go on any valid board square. Grammar prompts do not affect placement.</p>
        </div>
        <div className="grid gap-2">
          {templates.map((ship) => {
            const placed = player.ships.some((candidate) => candidate.id === ship.id);
            return (
              <div className="flex items-center justify-between rounded-lg border border-harbor-100 bg-harbor-50 p-3 dark:border-white/10 dark:bg-slate-800" key={ship.id}>
                <span className="font-bold text-harbor-900 dark:text-white">
                  {ship.type} <small className="text-slate-500">({ship.size})</small>
                </span>
                {placed ? (
                  <button className="rounded-md p-2 text-signal-coral hover:bg-white/70" type="button" onClick={() => onPlayerChange(removeShip(player, ship.id))} title="Remove ship">
                    <Trash2 size={18} />
                  </button>
                ) : (
                  <span className="text-sm font-bold text-slate-500">{nextTemplate?.id === ship.id ? "Next" : "Waiting"}</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-harbor-700 px-3 py-2 font-black text-harbor-900 dark:border-white/20 dark:text-white" type="button" onClick={() => setOrientation(orientation === "horizontal" ? "vertical" : "horizontal")}>
            <RotateCcw size={18} /> Rotate
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-harbor-700 px-3 py-2 font-black text-harbor-900 dark:border-white/20 dark:text-white" type="button" onClick={() => onPlayerChange(randomiseFleet(player))}>
            <Shuffle size={18} /> Random
          </button>
        </div>
        <button
          className="rounded-lg bg-harbor-700 px-5 py-3 font-black text-white hover:bg-harbor-900 disabled:opacity-40"
          disabled={player.ships.length !== templates.length}
          type="button"
          onClick={onDone}
        >
          Fleet Ready
        </button>
      </aside>
    </section>
  );
}
