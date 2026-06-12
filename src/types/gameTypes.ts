export type GrammarAnswer = "yes" | "no";
export type Orientation = "horizontal" | "vertical";
export type PlayerId = "p1" | "p2";
export type GameMode = "ai" | "hotseat";
export type AiDifficulty = "cadet" | "captain" | "admiral";
export type ThemeMode = "light" | "dark";

export type Coordinate = {
  row: number;
  col: number;
};

export type GrammarCategory =
  | "compound-adjective"
  | "compound-number"
  | "prefix-suffix"
  | "family-compound"
  | "fixed-compound"
  | "open-compound"
  | "adjective-noun"
  | "noun-phrase";

export type GrammarPrompt = {
  id: string;
  phrase: string;
  answer: GrammarAnswer;
  category: GrammarCategory;
  explanation: string;
};

export type GrammarPack = {
  id: string;
  name: string;
  yearLevel: string;
  description: string;
  prompts: GrammarPrompt[];
};

export type ShipDefinition = {
  type: "Battleship" | "Cruiser" | "Destroyer";
  size: number;
  count: number;
};

export type Ship = {
  id: string;
  type: ShipDefinition["type"];
  size: number;
  cells: Coordinate[];
  sunk: boolean;
};

export type CellStatus = "unknown" | "miss" | "hit" | "sunk";

export type BoardCell = {
  coordinate: Coordinate;
  shipId?: string;
  status: CellStatus;
  promptId: string;
};

export type Board = BoardCell[][];

export type PlayerStats = {
  shotsFired: number;
  correctGrammar: number;
  grammarAttempts: number;
  hits: number;
  misses: number;
  mistakesByCategory: Record<GrammarCategory, number>;
};

export type PlayerState = {
  id: PlayerId;
  name: string;
  board: Board;
  ships: Ship[];
  stats: PlayerStats;
  aiMemory: AiMemory;
};

export type AiMemory = {
  attempted: string[];
  hitQueue: Coordinate[];
};

export type AttackOutcome = {
  grammarCorrect: boolean;
  result: "hit" | "miss" | "sunk" | "blocked";
  explanation: string;
  prompt: GrammarPrompt;
  coordinate: Coordinate;
  sunkShip?: Ship;
};

export type TeacherSettings = {
  packId: string;
  aiDifficulty: AiDifficulty;
  showExplanations: boolean;
  soundEnabled: boolean;
  theme: ThemeMode;
};

export type PendingAttack = {
  attackerId: PlayerId;
  defenderId: PlayerId;
  coordinate: Coordinate;
  prompt: GrammarPrompt;
};
