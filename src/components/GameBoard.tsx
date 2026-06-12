import GridCell from "./GridCell";
import type { Board, Coordinate } from "../types/gameTypes";
import { Fragment } from "react";

type GameBoardProps = {
  board: Board;
  revealShips?: boolean;
  disabled?: boolean;
  previewCells?: Coordinate[];
  invalidPreview?: boolean;
  onCellClick?: (coordinate: Coordinate) => void;
  onCellHover?: (coordinate: Coordinate) => void;
};

const columns = ["A", "B", "C", "D", "E", "F"];

const keyFor = ({ row, col }: Coordinate) => `${row}-${col}`;

export default function GameBoard({
  board,
  revealShips = false,
  disabled = false,
  previewCells = [],
  invalidPreview = false,
  onCellClick,
  onCellHover
}: GameBoardProps) {
  const preview = new Set(previewCells.map(keyFor));

  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: "24px repeat(6, minmax(38px, 1fr))" }}>
      <div />
      {columns.map((column) => (
        <div className="text-center text-xs font-black text-harbor-700 dark:text-harbor-100" key={column}>
          {column}
        </div>
      ))}
      {board.map((row, rowIndex) => (
        <Fragment key={`board-row-${rowIndex}`}>
          <div className="grid place-items-center text-xs font-black text-harbor-700 dark:text-harbor-100">
            {rowIndex + 1}
          </div>
          {row.map((cell) => (
            <div key={`${cell.coordinate.row}-${cell.coordinate.col}`} onMouseEnter={() => onCellHover?.(cell.coordinate)}>
              <GridCell
                cell={cell}
                disabled={disabled || cell.status !== "unknown"}
                revealShips={revealShips}
                isPreview={preview.has(keyFor(cell.coordinate)) && !invalidPreview}
                isInvalidPreview={preview.has(keyFor(cell.coordinate)) && invalidPreview}
                onClick={() => onCellClick?.(cell.coordinate)}
              />
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
