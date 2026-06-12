import { BOARD_SIZE, coordinateKey, isWithinBoard } from "./battleshipEngine";
import type { AiDifficulty, Coordinate, PlayerState } from "../types/gameTypes";

const neighbours = ({ row, col }: Coordinate): Coordinate[] =>
  [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 }
  ].filter(isWithinBoard);

export const chooseAiAttack = (ai: PlayerState, opponent: PlayerState, difficulty: AiDifficulty): Coordinate => {
  const attempted = new Set(ai.aiMemory.attempted);
  const queueCandidate = ai.aiMemory.hitQueue.find((cell) => !attempted.has(coordinateKey(cell)));

  if (difficulty !== "cadet" && queueCandidate) return queueCandidate;

  const unknown = opponent.board
    .flat()
    .map((cell) => cell.coordinate)
    .filter((cell) => !attempted.has(coordinateKey(cell)));

  if (difficulty === "admiral") {
    const checkerboard = unknown.filter((cell) => (cell.row + cell.col) % 2 === 0);
    if (checkerboard.length > 0) return randomItem(checkerboard);
  }

  return randomItem(unknown);
};

export const rememberAiAttack = (
  ai: PlayerState,
  coordinate: Coordinate,
  wasHit: boolean,
  wasSunk: boolean
): PlayerState => {
  const attempted = Array.from(new Set([...ai.aiMemory.attempted, coordinateKey(coordinate)]));
  const addedTargets = wasHit && !wasSunk ? neighbours(coordinate) : [];
  const hitQueue = wasSunk
    ? []
    : [...ai.aiMemory.hitQueue, ...addedTargets].filter((cell) => !attempted.includes(coordinateKey(cell)));

  return { ...ai, aiMemory: { attempted, hitQueue } };
};

export const aiGrammarAnswerIsCorrect = (difficulty: AiDifficulty) => {
  const chance = difficulty === "cadet" ? 0.72 : difficulty === "captain" ? 0.84 : 0.92;
  return Math.random() < chance;
};

const randomItem = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
