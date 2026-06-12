import { hyphenPack } from "../data/hyphenPack";
import type { GrammarCategory, GrammarPack, GrammarPrompt, PlayerStats } from "../types/gameTypes";

export const grammarPacks: GrammarPack[] = [hyphenPack];

export const getPackById = (packId: string) =>
  grammarPacks.find((pack) => pack.id === packId) ?? grammarPacks[0];

export const getPromptById = (pack: GrammarPack, promptId: string) =>
  pack.prompts.find((prompt) => prompt.id === promptId) ?? pack.prompts[0];

export const categoryLabels: Record<GrammarCategory, string> = {
  "compound-adjective": "Compound adjectives",
  "compound-number": "Written numbers",
  "prefix-suffix": "Prefixes and self words",
  "family-compound": "Family compounds",
  "fixed-compound": "Fixed compounds",
  "open-compound": "Open compounds",
  "adjective-noun": "Simple adjective phrases",
  "noun-phrase": "Noun phrases"
};

export const chooseAdaptivePrompt = (pack: GrammarPack, stats: PlayerStats): GrammarPrompt => {
  const weighted = pack.prompts.flatMap((prompt) => {
    const mistakes = stats.mistakesByCategory[prompt.category] ?? 0;
    return Array.from({ length: Math.max(1, mistakes + 1) }, () => prompt);
  });
  return weighted[Math.floor(Math.random() * weighted.length)];
};
