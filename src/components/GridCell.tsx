import type { BoardCell } from "../types/gameTypes";
import { coordinateLabel } from "../logic/battleshipEngine";

type GridCellProps = {
  cell: BoardCell;
  revealShips?: boolean;
  isPreview?: boolean;
  isInvalidPreview?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

const statusClass: Record<BoardCell["status"], string> = {
  unknown: "bg-harbor-100 hover:bg-white",
  miss: "bg-sky-100 text-sky-800",
  hit: "bg-signal-coral text-white shadow-[inset_0_0_0_2px_rgba(255,255,255,0.45)]",
  sunk: "bg-slate-800 text-white"
};

export default function GridCell({
  cell,
  revealShips = false,
  isPreview = false,
  isInvalidPreview = false,
  disabled = false,
  onClick
}: GridCellProps) {
  const label = coordinateLabel(cell.coordinate);
  const showShip = revealShips && Boolean(cell.shipId);

  return (
    <button
      aria-label={`${label} ${cell.status}`}
      className={[
        "relative aspect-square rounded-md border border-white/70 text-sm font-black transition",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-harbor-700",
        statusClass[cell.status],
        showShip && cell.status === "unknown" ? "bg-harbor-500 text-white" : "",
        isPreview ? "ring-2 ring-signal-mint bg-signal-mint/30" : "",
        isInvalidPreview ? "ring-2 ring-signal-coral bg-signal-coral/25" : "",
        disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
      ].join(" ")}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      <span className="absolute left-1 top-1 text-[10px] font-bold opacity-70">{label}</span>
      <span className="grid h-full place-items-center">
        {cell.status === "miss" ? "•" : cell.status === "hit" ? "X" : cell.status === "sunk" ? "X" : showShip ? "■" : ""}
      </span>
    </button>
  );
}
