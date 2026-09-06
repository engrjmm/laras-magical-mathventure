import type { Mode, Question } from './game';
export type SaveData = {
  version: number;
  player: {
    name: string;
    avatarType: 'default' | 'photo';
    avatar?: string;
    totalCorrect: number;
    currentStreak: number;
    bestStreak: number;
    problemsSolved: number;
  };
  practice: {
    mode: Mode;
    selectedTables: number[];
    stats: Record<string, { attempts: number; correct: number }>;
  };
  adventure: {
    number: number;
    world: string;
    progress: number;
    target: number;
    adventuresCompleted: number;
  };
  rewards: {
    correctSinceLastReward: number;
    nextRewardThreshold: number;
    treasures: Record<string, number>;
  };
  customization: {
    unlockedAccessories: string[];
    equippedAccessory: string | null;
    unlockedCompanions: string[];
    selectedCompanion: string | null;
  };
  settings: { soundEffects: boolean; music: boolean };
  question?: Question;
};
export const DEFAULT_SAVE: SaveData = {
  version: 2,
  player: {
    name: 'Lara',
    avatarType: 'default',
    totalCorrect: 0,
    currentStreak: 0,
    bestStreak: 0,
    problemsSolved: 0,
  },
  practice: {
    mode: 'table',
    selectedTables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    stats: {},
  },
  adventure: {
    number: 1,
    world: 'Bunny Village',
    progress: 0,
    target: 15,
    adventuresCompleted: 0,
  },
  rewards: { correctSinceLastReward: 0, nextRewardThreshold: 5, treasures: {} },
  customization: {
    unlockedAccessories: ['Pretty Bow'],
    equippedAccessory: 'Pretty Bow',
    unlockedCompanions: [
      'Bunny',
      'Kitty',
      'Panda',
      'Unicorn',
      'Puppy',
      'Fox',
      'Chick',
      'Koala',
      'Hamster',
      'Otter',
      'Penguin',
      'Fawn',
      'Hedgehog',
      'Red Panda',
      'Seal',
      'Owl',
    ],
    selectedCompanion: 'Bunny',
  },
  settings: { soundEffects: true, music: true },
};
const num = (v: unknown, d: number, max = 999999) =>
  typeof v === 'number' && Number.isFinite(v)
    ? Math.max(0, Math.min(max, Math.floor(v)))
    : d;
export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem('lara-mathventure-v1');
    if (!raw) return structuredClone(DEFAULT_SAVE);
    const v = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_SAVE),
      ...v,
      version: 2,
      player: {
        ...DEFAULT_SAVE.player,
        ...v.player,
        totalCorrect: num(v.player?.totalCorrect, 0),
        currentStreak: num(v.player?.currentStreak, 0),
        bestStreak: num(v.player?.bestStreak, 0),
        problemsSolved: num(v.player?.problemsSolved, 0),
      },
      practice: {
        ...DEFAULT_SAVE.practice,
        ...v.practice,
        mode:
          typeof v.practice?.mode === 'string' &&
          [
            'addition',
            'subtraction',
            'table',
            '2x1',
            '3x1',
            '2x2',
            '3x2',
            'division-table',
            'division',
          ].includes(v.practice.mode)
            ? v.practice.mode
            : DEFAULT_SAVE.practice.mode,
        selectedTables: Array.isArray(v.practice?.selectedTables)
          ? v.practice.selectedTables.filter(
              (n: unknown) => typeof n === 'number' && n >= 1 && n <= 10,
            )
          : DEFAULT_SAVE.practice.selectedTables,
      },
      adventure: {
        ...DEFAULT_SAVE.adventure,
        ...v.adventure,
        number: num(v.adventure?.number, 1),
        progress: num(v.adventure?.progress, 0, 20),
        target: Math.max(12, num(v.adventure?.target, 15, 20)),
      },
      rewards: { ...DEFAULT_SAVE.rewards, ...v.rewards },
      customization: {
        ...DEFAULT_SAVE.customization,
        ...v.customization,
        unlockedCompanions: Array.from(
          new Set([
            ...DEFAULT_SAVE.customization.unlockedCompanions,
            ...(Array.isArray(v.customization?.unlockedCompanions)
              ? v.customization.unlockedCompanions
              : []),
          ]),
        ),
      },
      settings: { ...DEFAULT_SAVE.settings, ...v.settings },
      question:
        v.question && ['+', '−', '×', '÷'].includes(v.question.operator)
          ? v.question
          : undefined,
    };
  } catch {
    return structuredClone(DEFAULT_SAVE);
  }
}
export function storeSave(data: SaveData) {
  try {
    localStorage.setItem('lara-mathventure-v1', JSON.stringify(data));
  } catch {}
}
