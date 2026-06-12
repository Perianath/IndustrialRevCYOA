import type {
  AttackOutcome,
  Board,
  BoardCell,
  Coordinate,
  GrammarPack,
  GrammarPrompt,
  Orientation,
  PlayerState,
  PlayerStats,
  Ship,
  ShipDefinition
} from "../types/gameTypes";

export const BOARD_SIZE = 6;

export const FLEET: ShipDefinition[] = [
  { type: "Battleship", size: 4, count: 1 },
  { type: "Cruiser", size: 3, count: 2 },
  { type: "Destroyer", size: 2, count: 2 }
];

export const coordinateKey = ({ row, col }: Coordinate) => `${row}-${col}`;

export const coordinateLabel = ({ row, col }: Coordinate) =>
  `${String.fromCharCode(65 + col)}${row + 1}`;

export const emptyStats = (): PlayerStats => ({
  shotsFired: 0,
  correctGrammar: 0,
  grammarAttempts: 0,
  hits: 0,
  misses: 0,
  mistakesByCategory: {
    "compound-adjective": 0,
    "compound-number": 0,
    "prefix-suffix": 0,
    "family-compound": 0,
    "fixed-compound": 0,
    "open-compound": 0,
    "adjective-noun": 0,
    "noun-phrase": 0
  }
});

export const createEmptyBoard = (pack: GrammarPack): Board => {
  const shuffledPrompts = shuffle(pack.prompts);
  return Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, col) => ({
      coordinate: { row, col },
      status: "unknown",
      promptId: shuffledPrompts[(row * BOARD_SIZE + col) % shuffledPrompts.length].id
    }))
  );
};

export const createPlayer = (id: "p1" | "p2", name: string, pack: GrammarPack): PlayerState => ({
  id,
  name,
  board: createEmptyBoard(pack),
  ships: [],
  stats: emptyStats(),
  aiMemory: { attempted: [], hitQueue: [] }
});

export const allShipTemplates = () =>
  FLEET.flatMap((ship) =>
    Array.from({ length: ship.count }, (_, index) => ({
      id: `${ship.type.toLowerCase()}-${index + 1}`,
      type: ship.type,
      size: ship.size
    }))
  );

export const getCellsForPlacement = (
  start: Coordinate,
  size: number,
  orientation: Orientation
): Coordinate[] =>
  Array.from({ length: size }, (_, offset) => ({
    row: start.row + (orientation === "vertical" ? offset : 0),
    col: start.col + (orientation === "horizontal" ? offset : 0)
  }));

export const isWithinBoard = ({ row, col }: Coordinate) =>
  row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;

export const canPlaceShip = (
  board: Board,
  start: Coordinate,
  size: number,
  orientation: Orientation
) => {
  const cells = getCellsForPlacement(start, size, orientation);
  return cells.every((cell) => isWithinBoard(cell) && !board[cell.row][cell.col].shipId);
};

export const placeShip = (
  player: PlayerState,
  template: { id: string; type: Ship["type"]; size: number },
  start: Coordinate,
  orientation: Orientation
): PlayerState | null => {
  if (!canPlaceShip(player.board, start, template.size, orientation)) return null;

  const cells = getCellsForPlacement(start, template.size, orientation);
  const ship: Ship = { ...template, cells, sunk: false };
  const board = player.board.map((row) => row.map((cell) => ({ ...cell })));

  cells.forEach((cell) => {
    board[cell.row][cell.col].shipId = ship.id;
  });

  return {
    ...player,
    board,
    ships: [...player.ships.filter((existing) => existing.id !== ship.id), ship]
  };
};

export const removeShip = (player: PlayerState, shipId: string): PlayerState => {
  const board = player.board.map((row) =>
    row.map((cell) => (cell.shipId === shipId ? { ...cell, shipId: undefined } : { ...cell }))
  );
  return { ...player, board, ships: player.ships.filter((ship) => ship.id !== shipId) };
};

export const randomiseFleet = (player: PlayerState): PlayerState => {
  let nextPlayer: PlayerState = { ...player, board: player.board.map((row) => row.map((cell) => ({ ...cell, shipId: undefined }))), ships: [] };

  allShipTemplates().forEach((template) => {
    let placed = false;
    let guard = 0;
    while (!placed && guard < 300) {
      const start = {
        row: Math.floor(Math.random() * BOARD_SIZE),
        col: Math.floor(Math.random() * BOARD_SIZE)
      };
      const orientation: Orientation = Math.random() > 0.5 ? "horizontal" : "vertical";
      const placedPlayer = placeShip(nextPlayer, template, start, orientation);
      if (placedPlayer) {
        nextPlayer = placedPlayer;
        placed = true;
      }
      guard += 1;
    }
  });

  return nextPlayer;
};

export const resolveAttack = (
  attacker: PlayerState,
  defender: PlayerState,
  coordinate: Coordinate,
  prompt: GrammarPrompt,
  grammarCorrect: boolean
): { attacker: PlayerState; defender: PlayerState; outcome: AttackOutcome } => {
  const defenderBoard = defender.board.map((row) => row.map((cell) => ({ ...cell })));
  const attackerStats = { ...attacker.stats, mistakesByCategory: { ...attacker.stats.mistakesByCategory } };
  const defenderShips = defender.ships.map((ship) => ({ ...ship, cells: [...ship.cells] }));
  const target = defenderBoard[coordinate.row][coordinate.col];

  attackerStats.grammarAttempts += 1;

  if (!grammarCorrect) {
    attackerStats.misses += 1;
    attackerStats.mistakesByCategory[prompt.category] += 1;
    target.status = target.status === "unknown" ? "miss" : target.status;
    return {
      attacker: { ...attacker, stats: attackerStats },
      defender: { ...defender, board: defenderBoard },
      outcome: { grammarCorrect, result: "blocked", explanation: prompt.explanation, prompt, coordinate }
    };
  }

  attackerStats.correctGrammar += 1;
  attackerStats.shotsFired += 1;

  if (!target.shipId) {
    attackerStats.misses += 1;
    target.status = "miss";
    return {
      attacker: { ...attacker, stats: attackerStats },
      defender: { ...defender, board: defenderBoard },
      outcome: { grammarCorrect, result: "miss", explanation: prompt.explanation, prompt, coordinate }
    };
  }

  attackerStats.hits += 1;
  target.status = "hit";
  const ship = defenderShips.find((candidate) => candidate.id === target.shipId);

  if (ship && ship.cells.every((cell) => defenderBoard[cell.row][cell.col].status === "hit" || defenderBoard[cell.row][cell.col].status === "sunk")) {
    ship.sunk = true;
    ship.cells.forEach((cell) => {
      defenderBoard[cell.row][cell.col].status = "sunk";
    });
    return {
      attacker: { ...attacker, stats: attackerStats },
      defender: { ...defender, board: defenderBoard, ships: defenderShips },
      outcome: { grammarCorrect, result: "sunk", explanation: prompt.explanation, prompt, coordinate, sunkShip: ship }
    };
  }

  return {
    attacker: { ...attacker, stats: attackerStats },
    defender: { ...defender, board: defenderBoard, ships: defenderShips },
    outcome: { grammarCorrect, result: "hit", explanation: prompt.explanation, prompt, coordinate }
  };
};

export const hasLost = (player: PlayerState) =>
  player.ships.length > 0 && player.ships.every((ship) => ship.sunk);

export const getCell = (board: Board, coordinate: Coordinate): BoardCell => board[coordinate.row][coordinate.col];

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}
