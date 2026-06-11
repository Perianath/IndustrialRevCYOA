import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Clipboard, Home, NotebookTabs, RotateCcw, ScrollText, Sparkles, X } from "lucide-react";
import factoryChildUrl from "./data/factory_child.json?url";
import ruralChildUrl from "./data/rural_child.json?url";
import engineerUrl from "./data/engineer.json?url";
import ownerChildUrl from "./data/owner_child.json?url";
import reformerUrl from "./data/reformer.json?url";
import sharedUrl from "./data/shared.json?url";

type StatKey = "money" | "health" | "skills" | "reputation" | "reform";
type Stats = Record<StatKey, number>;
type Screen = "title" | "roles" | "story" | "notebook" | "final";

type RoleName = "Factory Child" | "Rural Farmer’s Child" | "Apprentice Engineer" | "Mill Owner’s Child" | "Young Reformer" | "shared";

type Role = {
  id: string;
  name: Exclude<RoleName, "shared">;
  summary: string;
  startScene: string;
  statAdjustments: Stats;
};

type Choice = {
  label: string;
  next: string;
  effects: Stats;
};

type Scene = {
  id: string;
  role: RoleName;
  title: string;
  text: string;
  historyNote: string;
  glossaryTerms: string[];
  evidence: string[];
  choices: Choice[];
};

type StoryBundle = {
  scenes: Record<string, Scene>;
  files: string[];
};

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; bundle: StoryBundle }
  | { status: "error"; fileName: string; message: string };

type SaveState = {
  screen: Screen;
  roleId: string | null;
  sceneId: string | null;
  stats: Stats;
  evidence: string[];
  visitedScenes: string[];
  reflection: string;
};

const storyTitle = "Smoke, Steam and Survival";
const storySubtitle = "A Year 8 History choose-your-own-adventure about life during the Industrial Revolution.";
const saveKey = "smoke-steam-survival-save";
const finalReflectionSceneId = "shared-10-final-reflection";

const dataFiles = [
  { fileName: "factory_child.json", url: factoryChildUrl },
  { fileName: "rural_child.json", url: ruralChildUrl },
  { fileName: "engineer.json", url: engineerUrl },
  { fileName: "owner_child.json", url: ownerChildUrl },
  { fileName: "reformer.json", url: reformerUrl },
  { fileName: "shared.json", url: sharedUrl }
];

const statLabels: Record<StatKey, string> = {
  money: "Money",
  health: "Health",
  skills: "Skills",
  reputation: "Reputation",
  reform: "Reform"
};

const statOrder: StatKey[] = ["money", "health", "skills", "reputation", "reform"];

const startingStats: Stats = {
  money: 5,
  health: 5,
  skills: 5,
  reputation: 5,
  reform: 0
};

const roles: Role[] = [
  {
    id: "factory-child",
    name: "Factory Child",
    summary: "Work in a cotton mill and face long hours, machines, injury and reform.",
    startScene: "factory-child-01-mill-bell",
    statAdjustments: { money: 1, health: -1, skills: 0, reputation: 0, reform: 0 }
  },
  {
    id: "rural-child",
    name: "Rural Farmer’s Child",
    summary: "Experience enclosure, rural poverty and the journey toward Manchester.",
    startScene: "rural-child-01-common-land",
    statAdjustments: { money: -1, health: 1, skills: 0, reputation: 0, reform: 0 }
  },
  {
    id: "engineer",
    name: "Apprentice Engineer",
    summary: "Learn how inventions, steam, coal, iron and transport changed Britain.",
    startScene: "engineer-01-workshop",
    statAdjustments: { money: 0, health: 0, skills: 2, reputation: 1, reform: 0 }
  },
  {
    id: "owner-child",
    name: "Mill Owner’s Child",
    summary: "Weigh profit, investment, empire, competition and moral responsibility.",
    startScene: "owner-child-01-counting-house",
    statAdjustments: { money: 3, health: 1, skills: 0, reputation: 1, reform: -1 }
  },
  {
    id: "reformer",
    name: "Young Reformer",
    summary: "Gather evidence, organise petitions and push Parliament toward reform.",
    startScene: "reformer-01-print-shop",
    statAdjustments: { money: 0, health: 0, skills: 1, reputation: 0, reform: 2 }
  }
];

const glossaryDefinitions: Record<string, string> = {
  "Factory Acts": "British laws that gradually limited child labour, reduced hours and improved factory inspection.",
  "Industrial Revolution": "A period of major change when machines, factories, coal power and cities grew rapidly.",
  Parliament: "The law-making body in Britain.",
  apprentice: "A young person learning a skilled trade from an experienced worker.",
  canal: "A human-made waterway used to move heavy goods.",
  "child labour": "The employment of children, often in tiring or dangerous work.",
  coal: "A fuel burned to power steam engines and heat ironworks.",
  cotton: "A plant fibre used to make thread and cloth.",
  enclosure: "The process of turning shared or open land into private fenced farms.",
  evidence: "Information used to support a historical argument.",
  factory: "A workplace where machines and workers produce goods.",
  "flying shuttle": "A weaving invention that made looms faster.",
  iron: "A strong metal used for machines, rails, bridges and tools.",
  petition: "A written request signed by people asking for change.",
  pollution: "Harmful smoke, waste or dirty water affecting the environment and health.",
  "public health": "Community action to protect people's health, such as clean water and sanitation.",
  reform: "A change intended to improve laws, workplaces or society.",
  railway: "A transport system using trains on iron rails.",
  sanitation: "Systems for clean water, drains and waste removal.",
  "spinning jenny": "A machine that let one worker spin several threads at once.",
  "steam engine": "A machine powered by steam, used in mines, factories, ships and locomotives.",
  "steam power": "Power produced by steam engines.",
  union: "An organisation of workers joining together to improve pay and conditions.",
  urbanisation: "The growth of towns and cities as people move there for work.",
  "water frame": "A water-powered spinning machine that helped shift textile production into factories."
};

const emptySave: SaveState = {
  screen: "title",
  roleId: null,
  sceneId: null,
  stats: startingStats,
  evidence: [],
  visitedScenes: [],
  reflection: ""
};

async function loadStoryFiles(): Promise<StoryBundle> {
  const scenes: Record<string, Scene> = {};

  for (const file of dataFiles) {
    let parsed: unknown;
    try {
      const response = await fetch(file.url);
      if (!response.ok) {
        throw new Error(`Could not load ${file.fileName} (${response.status}).`);
      }
      parsed = JSON.parse(await response.text());
    } catch (error) {
      throw new StoryFileError(file.fileName, error instanceof Error ? error.message : "Invalid JSON.");
    }

    if (!Array.isArray(parsed)) {
      throw new StoryFileError(file.fileName, "Expected the file to contain an array of scenes.");
    }

    for (const scene of parsed) {
      if (!isScene(scene)) {
        throw new StoryFileError(file.fileName, "A scene does not match the required schema.");
      }
      if (scenes[scene.id]) {
        throw new StoryFileError(file.fileName, `Duplicate scene ID found: ${scene.id}.`);
      }
      scenes[scene.id] = scene;
    }
  }

  return { scenes, files: dataFiles.map((file) => file.fileName) };
}

class StoryFileError extends Error {
  constructor(public fileName: string, message: string) {
    super(message);
  }
}

function isScene(value: unknown): value is Scene {
  if (!value || typeof value !== "object") return false;
  const scene = value as Partial<Scene>;
  return (
    typeof scene.id === "string" &&
    typeof scene.role === "string" &&
    typeof scene.title === "string" &&
    typeof scene.text === "string" &&
    typeof scene.historyNote === "string" &&
    Array.isArray(scene.glossaryTerms) &&
    Array.isArray(scene.evidence) &&
    Array.isArray(scene.choices) &&
    scene.choices.every(isChoice)
  );
}

function isChoice(value: unknown): value is Choice {
  if (!value || typeof value !== "object") return false;
  const choice = value as Partial<Choice>;
  return (
    typeof choice.label === "string" &&
    typeof choice.next === "string" &&
    Boolean(choice.effects) &&
    statOrder.every((key) => typeof choice.effects?.[key] === "number")
  );
}

function addStats(base: Stats, changes: Partial<Stats>): Stats {
  return statOrder.reduce((next, key) => {
    next[key] = Math.max(0, Math.min(12, base[key] + (changes[key] ?? 0)));
    return next;
  }, {} as Stats);
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function validateStory(bundle: StoryBundle) {
  const messages: string[] = [];
  const sceneIds = new Set(Object.keys(bundle.scenes));

  for (const role of roles) {
    if (!sceneIds.has(role.startScene)) {
      messages.push(`Role "${role.name}" starts at missing scene ID "${role.startScene}".`);
    }
  }

  for (const scene of Object.values(bundle.scenes)) {
    if (scene.choices.length > 0 && scene.choices.length !== 3) {
      messages.push(`Scene "${scene.id}" has ${scene.choices.length} choices. Non-ending scenes should have exactly three.`);
    }
    for (const choice of scene.choices) {
      if (!sceneIds.has(choice.next)) {
        messages.push(`Scene "${scene.id}" has a choice pointing to missing scene ID "${choice.next}".`);
      }
    }
  }

  return messages;
}

export default function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [save, setSave] = useState<SaveState>(() => {
    const stored = window.localStorage.getItem(saveKey);
    if (!stored) return emptySave;
    try {
      return { ...emptySave, ...JSON.parse(stored) } as SaveState;
    } catch {
      return emptySave;
    }
  });
  const [glossaryTerm, setGlossaryTerm] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [missingSceneId, setMissingSceneId] = useState<string | null>(null);
  const [validationMessages, setValidationMessages] = useState<string[] | null>(null);

  useEffect(() => {
    loadStoryFiles()
      .then((bundle) => setLoadState({ status: "loaded", bundle }))
      .catch((error) => {
        if (error instanceof StoryFileError) {
          setLoadState({ status: "error", fileName: error.fileName, message: error.message });
          return;
        }
        setLoadState({ status: "error", fileName: "unknown file", message: error instanceof Error ? error.message : "Unknown loading error." });
      });
  }, []);

  useEffect(() => {
    window.localStorage.setItem(saveKey, JSON.stringify(save));
  }, [save]);

  const bundle = loadState.status === "loaded" ? loadState.bundle : null;
  const selectedRole = roles.find((role) => role.id === save.roleId) ?? null;
  const currentScene = save.sceneId && bundle ? bundle.scenes[save.sceneId] : null;
  const hasSavedGame = Boolean(save.roleId && save.sceneId);

  const allSceneGlossary = useMemo(() => {
    const sceneTerms = currentScene?.glossaryTerms ?? [];
    return sceneTerms.map((term) => ({ term, definition: glossaryDefinitions[term] ?? "This term is listed in the story data. Add a definition in App.tsx if you want one shown here." }));
  }, [currentScene]);

  const startRole = (role: Role) => {
    if (!bundle) return;
    const firstScene = bundle.scenes[role.startScene];
    if (!firstScene) {
      setMissingSceneId(role.startScene);
      return;
    }
    const nextStats = addStats(startingStats, role.statAdjustments);
    setMissingSceneId(null);
    setValidationMessages(null);
    setSave({
      screen: "story",
      roleId: role.id,
      sceneId: role.startScene,
      stats: nextStats,
      evidence: unique(firstScene.evidence),
      visitedScenes: [role.startScene],
      reflection: ""
    });
  };

  const choose = (choice: Choice) => {
    if (!bundle) return;
    const nextScene = bundle.scenes[choice.next];
    if (!nextScene) {
      setMissingSceneId(choice.next);
      return;
    }

    const nextScreen: Screen = nextScene.choices.length === 0 || choice.next === finalReflectionSceneId ? "final" : "story";
    setMissingSceneId(null);
    setSave((previous) => ({
      ...previous,
      screen: nextScreen,
      sceneId: choice.next,
      stats: addStats(previous.stats, choice.effects),
      evidence: unique([...previous.evidence, ...nextScene.evidence]),
      visitedScenes: unique([...previous.visitedScenes, choice.next])
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const restart = () => {
    window.localStorage.removeItem(saveKey);
    setGlossaryTerm(null);
    setCopied(false);
    setMissingSceneId(null);
    setValidationMessages(null);
    setSave(emptySave);
  };

  const runValidation = () => {
    if (!bundle) return;
    setValidationMessages(validateStory(bundle));
  };

  const copyReflection = async () => {
    const text = [
      `${storyTitle} Reflection`,
      `Role: ${selectedRole?.name ?? "Not selected"}`,
      "",
      "Final stats:",
      ...statOrder.map((key) => `${statLabels[key]}: ${save.stats[key]}`),
      "",
      "Evidence collected:",
      ...save.evidence.map((item) => `- ${item}`),
      "",
      "Reflection:",
      save.reflection || "(No reflection written yet.)"
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (loadState.status === "loading") {
    return <Shell><StatusPanel title="Loading Story" message="Loading classroom story files from src/data..." /></Shell>;
  }

  if (loadState.status === "error") {
    return (
      <Shell>
        <StatusPanel
          title="Story File Error"
          message={`The app could not load ${loadState.fileName}. Please check that this JSON file is valid and follows the scene schema.`}
          detail={loadState.message}
        />
      </Shell>
    );
  }

  const storyBody = missingSceneId ? (
    <TeacherError sceneId={missingSceneId} onRestart={restart} />
  ) : save.screen === "title" ? (
    <TitleScreen
      hasSavedGame={hasSavedGame}
      onStart={() => setSave((previous) => ({ ...previous, screen: "roles" }))}
      onContinue={() => setSave((previous) => ({ ...previous, screen: previous.sceneId && loadState.bundle.scenes[previous.sceneId]?.choices.length === 0 ? "final" : "story" }))}
    />
  ) : save.screen === "roles" ? (
    <RoleSelection roles={roles} onSelect={startRole} />
  ) : save.screen === "story" && currentScene && selectedRole ? (
    <StoryScreen role={selectedRole} scene={currentScene} stats={save.stats} glossary={allSceneGlossary} onChoose={choose} onGlossary={setGlossaryTerm} />
  ) : save.screen === "story" && save.sceneId ? (
    <TeacherError sceneId={save.sceneId} onRestart={restart} />
  ) : save.screen === "notebook" ? (
    <NotebookScreen
      evidence={save.evidence}
      visitedScenes={save.visitedScenes}
      stats={save.stats}
      scenes={loadState.bundle.scenes}
      onBack={() => setSave((previous) => ({ ...previous, screen: previous.sceneId && loadState.bundle.scenes[previous.sceneId]?.choices.length === 0 ? "final" : "story" }))}
    />
  ) : (
    <FinalScreen
      stats={save.stats}
      evidence={save.evidence}
      reflection={save.reflection}
      copied={copied}
      role={selectedRole}
      onReflection={(reflection) => setSave((previous) => ({ ...previous, reflection }))}
      onCopy={copyReflection}
      onRestart={restart}
    />
  );

  return (
    <Shell>
      <Header
        screen={save.screen}
        onHome={() => setSave((previous) => ({ ...previous, screen: "title" }))}
        onNotebook={() => setSave((previous) => ({ ...previous, screen: "notebook" }))}
        onRestart={restart}
        onValidate={import.meta.env.DEV ? runValidation : undefined}
        notebookDisabled={!hasSavedGame}
      />
      <ValidationPanel messages={validationMessages} fileCount={loadState.bundle.files.length} sceneCount={Object.keys(loadState.bundle.scenes).length} />
      {storyBody}
      <GlossaryModal term={glossaryTerm} onClose={() => setGlossaryTerm(null)} />
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-paper text-ink">{children}</div>;
}

function Header({
  screen,
  onHome,
  onNotebook,
  onRestart,
  onValidate,
  notebookDisabled
}: {
  screen: Screen;
  onHome: () => void;
  onNotebook: () => void;
  onRestart: () => void;
  onValidate?: () => void;
  notebookDisabled: boolean;
}) {
  return (
    <header className="border-b border-soot/10 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brick">Year 8 History</p>
          <h1 className="text-xl font-black text-soot sm:text-2xl">{storyTitle}</h1>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Game controls">
          <IconButton label="Home" onClick={onHome} disabled={screen === "title"}>
            <Home size={19} />
          </IconButton>
          <IconButton label="Notebook" onClick={onNotebook} disabled={notebookDisabled}>
            <NotebookTabs size={19} />
          </IconButton>
          {onValidate ? (
            <button className="secondary-button" type="button" onClick={onValidate}>
              Validate Story
            </button>
          ) : null}
          <IconButton label="Restart" onClick={onRestart}>
            <RotateCcw size={19} />
          </IconButton>
        </nav>
      </div>
    </header>
  );
}

function TitleScreen({ hasSavedGame, onStart, onContinue }: { hasSavedGame: boolean; onStart: () => void; onContinue: () => void }) {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-12">
      <section className="flex min-h-[520px] flex-col justify-between overflow-hidden rounded-lg bg-soot text-white shadow-soft">
        <div className="grid grow content-center gap-5 p-6 sm:p-10">
          <p className="w-fit rounded bg-brass px-3 py-1 text-sm font-black uppercase text-soot">Interactive source notebook</p>
          <div>
            <h2 className="max-w-3xl text-5xl font-black leading-tight sm:text-6xl">{storyTitle}</h2>
            <p className="mt-4 max-w-2xl text-xl leading-8 text-paper">{storySubtitle}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="primary-button" type="button" onClick={onStart}>
              Choose your role
            </button>
            <button className="secondary-dark-button" type="button" onClick={onContinue} disabled={!hasSavedGame}>
              Load saved game
            </button>
          </div>
        </div>
        <div className="grid min-h-48 border-t border-white/15 bg-[linear-gradient(135deg,#55372d_0%,#2f6f73_45%,#1f2933_100%)] p-6">
          <div className="image-placeholder border-white/35 bg-white/10 text-white">
            <Sparkles size={30} />
            <span>Factory towns, steam power, reform debates and everyday survival</span>
          </div>
        </div>
      </section>

      <aside className="grid content-start gap-4">
        <InfoPanel title="Learning Goal">
          Explore how the Industrial Revolution created new opportunities while also causing serious problems in work, health, housing and the environment.
        </InfoPanel>
        <InfoPanel title="How It Works">
          Choose a role, read each scene, collect evidence, check glossary terms and make decisions. At the end, write a balanced historical reflection.
        </InfoPanel>
        <InfoPanel title="Story Files">
          The app loads six JSON files from src/data and combines them into one scene map by ID.
        </InfoPanel>
      </aside>
    </main>
  );
}

function RoleSelection({ roles, onSelect }: { roles: Role[]; onSelect: (role: Role) => void }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 max-w-3xl">
        <p className="text-sm font-black uppercase text-brick">Choose a viewpoint</p>
        <h2 className="text-4xl font-black text-soot">Who will you become?</h2>
        <p className="mt-2 text-lg text-slate-700">Each role starts with different strengths and pressures, then faces choices based on real historical conditions.</p>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {roles.map((role) => (
          <button key={role.id} className="role-card" type="button" onClick={() => onSelect(role)}>
            <span className="text-sm font-black uppercase text-brick">Role</span>
            <strong className="text-2xl leading-tight text-soot">{role.name}</strong>
            <span className="text-base font-medium text-slate-700">{role.summary}</span>
          </button>
        ))}
      </section>
    </main>
  );
}

function StoryScreen({
  role,
  scene,
  stats,
  glossary,
  onChoose,
  onGlossary
}: {
  role: Role;
  scene: Scene;
  stats: Stats;
  glossary: { term: string; definition: string }[];
  onChoose: (choice: Choice) => void;
  onGlossary: (term: string) => void;
}) {
  return (
    <main className="mx-auto grid max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[1fr_320px]">
      <section className="grid gap-5">
        <article className="panel">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase text-brick">{role.name}</p>
              <h2 className="text-4xl font-black leading-tight text-soot">{scene.title}</h2>
            </div>
            <span className="rounded border border-canal/30 bg-canal/10 px-3 py-1 text-sm font-black text-canal">{scene.id}</span>
          </div>
          <div className="image-placeholder">
            <ScrollText size={32} />
            <span>Image placeholder for: {scene.title}</span>
          </div>
          <p className="mt-5 text-xl leading-9 text-slate-800">{scene.text}</p>
        </article>

        <article className="panel border-l-4 border-l-brass">
          <h3 className="section-title">Historical Note</h3>
          <p className="text-lg leading-8 text-slate-700">{scene.historyNote}</p>
        </article>

        <section className="panel">
          <h3 className="section-title">Choose What To Do</h3>
          <div className="mt-4 grid gap-3">
            {scene.choices.map((choice) => (
              <button key={choice.label} className="choice-button" type="button" onClick={() => onChoose(choice)}>
                <span>{choice.label}</span>
                <span className="choice-stats">{formatStatChanges(choice.effects)}</span>
              </button>
            ))}
          </div>
        </section>
      </section>

      <aside className="grid content-start gap-5">
        <StatsPanel stats={stats} />
        <section className="panel">
          <h3 className="section-title">Evidence Gained</h3>
          <ul className="mt-2 grid gap-2 text-base leading-7 text-slate-700">
            {scene.evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <h3 className="section-title">Glossary</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {glossary.map(({ term }) => (
              <button key={term} className="term-button" type="button" onClick={() => onGlossary(term)}>
                {term}
              </button>
            ))}
          </div>
        </section>
      </aside>
    </main>
  );
}

function NotebookScreen({
  evidence,
  visitedScenes,
  stats,
  scenes,
  onBack
}: {
  evidence: string[];
  visitedScenes: string[];
  stats: Stats;
  scenes: Record<string, Scene>;
  onBack: () => void;
}) {
  return (
    <main className="mx-auto grid max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[1fr_320px]">
      <section className="panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase text-brick">Evidence notebook</p>
            <h2 className="text-4xl font-black text-soot">Collected Evidence</h2>
          </div>
          <button className="secondary-button" type="button" onClick={onBack}>
            Return to game
          </button>
        </div>
        {evidence.length ? (
          <ol className="grid gap-3">
            {evidence.map((item, index) => (
              <li key={item} className="rounded-lg border border-fog bg-white p-4 text-lg leading-7">
                <span className="font-black text-brick">Evidence {index + 1}: </span>
                {item}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-lg text-slate-700">No evidence collected yet.</p>
        )}
      </section>
      <aside className="grid content-start gap-5">
        <StatsPanel stats={stats} />
        <InfoPanel title="Scenes Visited">
          {visitedScenes.length ? visitedScenes.map((sceneId) => scenes[sceneId]?.title ?? sceneId).join(", ") : "No scenes visited yet."}
        </InfoPanel>
      </aside>
    </main>
  );
}

function FinalScreen({
  stats,
  evidence,
  reflection,
  copied,
  role,
  onReflection,
  onCopy,
  onRestart
}: {
  stats: Stats;
  evidence: string[];
  reflection: string;
  copied: boolean;
  role: Role | null;
  onReflection: (value: string) => void;
  onCopy: () => void;
  onRestart: () => void;
}) {
  return (
    <main className="mx-auto grid max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[1fr_340px]">
      <section className="panel">
        <p className="text-sm font-black uppercase text-brick">Final reflection</p>
        <h2 className="text-4xl font-black leading-tight text-soot">Was the Industrial Revolution mainly positive, mainly negative, or mixed?</h2>
        <p className="mt-3 text-lg leading-8 text-slate-700">
          Use your evidence notebook to support your answer. A strong response explains both benefits and harms before making a judgement.
        </p>
        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-black uppercase text-soot">Student reflection</span>
          <textarea
            className="min-h-64 w-full rounded-lg border border-fog bg-white p-4 text-lg leading-8 outline-none ring-brass/40 transition focus:ring-4"
            value={reflection}
            onChange={(event) => onReflection(event.target.value)}
            placeholder="I think the Industrial Revolution was..."
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="primary-button" type="button" onClick={onCopy}>
            <Clipboard size={20} /> {copied ? "Copied" : "Copy reflection"}
          </button>
          <button className="secondary-button" type="button" onClick={onRestart}>
            <RotateCcw size={20} /> Restart
          </button>
        </div>
      </section>
      <aside className="grid content-start gap-5">
        <InfoPanel title="Role">{role?.name ?? "Unknown"}</InfoPanel>
        <StatsPanel stats={stats} />
        <section className="panel">
          <h3 className="section-title">Evidence Collected</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-700">
            {evidence.map((item) => (
              <li key={item} className="rounded border border-fog bg-white p-3">
                {item}
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </main>
  );
}

function ValidationPanel({ messages, fileCount, sceneCount }: { messages: string[] | null; fileCount: number; sceneCount: number }) {
  if (!messages) return null;
  return (
    <section className="mx-auto mt-4 max-w-6xl px-4">
      <div className={`rounded-lg border p-4 ${messages.length ? "border-brick bg-red-50" : "border-canal bg-green-50"}`}>
        <p className="font-black text-soot">
          {messages.length ? "Story validation found issues." : `Story validation passed: ${sceneCount} scenes loaded from ${fileCount} files.`}
        </p>
        {messages.length ? (
          <ul className="mt-2 grid gap-1 text-sm text-slate-700">
            {messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

function TeacherError({ sceneId, onRestart }: { sceneId: string; onRestart: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <section className="panel border-l-4 border-l-brick">
        <p className="text-sm font-black uppercase text-brick">Teacher Story Error</p>
        <h2 className="mt-2 text-3xl font-black text-soot">Missing Scene ID</h2>
        <p className="mt-3 text-lg leading-8 text-slate-700">
          The story tried to open scene ID <span className="font-black text-brick">{sceneId}</span>, but that ID was not found in the loaded JSON files.
          Check the choice `next` value or add a scene with this ID.
        </p>
        <button className="secondary-button mt-4" type="button" onClick={onRestart}>
          Restart game
        </button>
      </section>
    </main>
  );
}

function StatusPanel({ title, message, detail }: { title: string; message: string; detail?: string }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <section className="panel max-w-2xl">
        <p className="text-sm font-black uppercase text-brick">Teacher notice</p>
        <h1 className="mt-2 text-4xl font-black text-soot">{title}</h1>
        <p className="mt-3 text-lg leading-8 text-slate-700">{message}</p>
        {detail ? <pre className="mt-4 overflow-auto rounded-lg bg-soot p-4 text-sm text-white">{detail}</pre> : null}
      </section>
    </main>
  );
}

function StatsPanel({ stats }: { stats: Stats }) {
  return (
    <section className="panel">
      <h3 className="section-title">Player Stats</h3>
      <div className="mt-3 grid gap-3">
        {statOrder.map((key) => (
          <div key={key}>
            <div className="mb-1 flex justify-between text-sm font-black uppercase text-slate-700">
              <span>{statLabels[key]}</span>
              <span>{stats[key]}</span>
            </div>
            <div className="h-3 overflow-hidden rounded bg-fog">
              <div className="h-full rounded bg-canal" style={{ width: `${Math.min(100, (stats[key] / 12) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function GlossaryModal({ term, onClose }: { term: string | null; onClose: () => void }) {
  if (!term) return null;
  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-soot/70 p-4" role="dialog" aria-modal="true" aria-labelledby="glossary-title">
      <section className="w-full max-w-lg rounded-lg bg-paper p-5 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase text-brick">Glossary</p>
            <h2 id="glossary-title" className="text-3xl font-black capitalize text-soot">
              {term}
            </h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close glossary">
            <X size={20} />
          </button>
        </div>
        <p className="mt-4 text-lg leading-8 text-slate-700">{glossaryDefinitions[term] ?? "This term appears in the story data."}</p>
      </section>
    </div>
  );
}

function InfoPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel">
      <h3 className="section-title">{title}</h3>
      <p className="mt-2 text-base leading-7 text-slate-700">{children}</p>
    </section>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button className="icon-button" type="button" onClick={onClick} disabled={disabled} title={label} aria-label={label}>
      {children}
    </button>
  );
}

function formatStatChanges(changes: Stats) {
  return statOrder
    .filter((key) => changes[key] !== 0)
    .map((key) => `${changes[key] > 0 ? "+" : ""}${changes[key]} ${statLabels[key]}`)
    .join(" | ") || "No stat change";
}
