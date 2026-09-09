export const MODES = {
  ADDITION_EASY: 'addition-easy',
  ADDITION_MEDIUM: 'addition-medium',
  ADDITION_HARD: 'addition-hard',
  SUBTRACTION_EASY: 'subtraction-easy',
  SUBTRACTION_MEDIUM: 'subtraction-medium',
  SUBTRACTION_HARD: 'subtraction-hard',
  TABLE: 'table',
  TWO_BY_ONE: '2x1',
  THREE_BY_ONE: '3x1',
  TWO_BY_TWO: '2x2',
  THREE_BY_TWO: '3x2',
  DIVISION_TABLE: 'division-table',
  DIVISION_MEDIUM: 'division-medium',
  DIVISION_HARD: 'division-hard',
} as const;
export type Mode = (typeof MODES)[keyof typeof MODES];
export type Operator = '+' | '−' | '×' | '÷';
export type Question = {
  a: number;
  b: number;
  answer: number;
  options: number[];
  key: string;
  operator: Operator;
};
export const MODE_INFO: Record<
  Mode,
  {
    name: string;
    icon: string;
    note: string;
    workspace: boolean;
    subject: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }
> = {
  'addition-easy': {
    name: 'Easy',
    icon: '🌱',
    note: 'Add numbers through 20',
    workspace: false,
    subject: 'Addition',
    difficulty: 'easy',
  },
  'addition-medium': {
    name: 'Medium',
    icon: '🌈',
    note: 'Add 2-digit numbers',
    workspace: true,
    subject: 'Addition',
    difficulty: 'medium',
  },
  'addition-hard': {
    name: 'Hard',
    icon: '✨',
    note: 'Add 3-digit numbers with carrying',
    workspace: true,
    subject: 'Addition',
    difficulty: 'hard',
  },
  'subtraction-easy': {
    name: 'Easy',
    icon: '🌱',
    note: 'Subtract numbers through 20',
    workspace: false,
    subject: 'Subtraction',
    difficulty: 'easy',
  },
  'subtraction-medium': {
    name: 'Medium',
    icon: '🌙',
    note: 'Subtract 2-digit numbers',
    workspace: true,
    subject: 'Subtraction',
    difficulty: 'medium',
  },
  'subtraction-hard': {
    name: 'Hard',
    icon: '⭐',
    note: 'Subtract 3-digit numbers with regrouping',
    workspace: true,
    subject: 'Subtraction',
    difficulty: 'hard',
  },
  table: {
    name: 'Table Facts',
    icon: '🌱',
    note: 'Facts from 1 to 10',
    workspace: false,
    subject: 'Multiplication',
    difficulty: 'easy',
  },
  '2x1': {
    name: 'Easy · 2 × 1',
    icon: '🌸',
    note: '2-digit by 1-digit',
    workspace: true,
    subject: 'Multiplication',
    difficulty: 'easy',
  },
  '3x1': {
    name: 'Medium · 3 × 1',
    icon: '⭐',
    note: '3-digit by 1-digit',
    workspace: true,
    subject: 'Multiplication',
    difficulty: 'medium',
  },
  '2x2': {
    name: 'Medium · 2 × 2',
    icon: '🦄',
    note: 'Practice partial products',
    workspace: true,
    subject: 'Multiplication',
    difficulty: 'medium',
  },
  '3x2': {
    name: 'Hard · 3 × 2',
    icon: '👑',
    note: 'A royal challenge',
    workspace: true,
    subject: 'Multiplication',
    difficulty: 'hard',
  },
  'division-table': {
    name: 'Easy',
    icon: '🍓',
    note: 'Whole-number facts through 10',
    workspace: false,
    subject: 'Division',
    difficulty: 'easy',
  },
  'division-medium': {
    name: 'Medium',
    icon: '💎',
    note: '2-digit whole-number division',
    workspace: true,
    subject: 'Division',
    difficulty: 'medium',
  },
  'division-hard': {
    name: 'Hard',
    icon: '👑',
    note: '3-digit whole-number division',
    workspace: true,
    subject: 'Division',
    difficulty: 'hard',
  },
};
export const WORLDS = [
  'Cherry Blossom Garden',
  'Rainbow Valley',
  'Unicorn Kingdom',
  'Fairy Garden',
  'Mermaid Lagoon',
  'Moonlight Forest',
  'Candy Kingdom',
  'Panda Forest',
  'Cloud Kingdom',
  'Enchanted Castle',
  'Sunflower Meadow',
  'Snowflake Village',
  'Cupcake Town',
  'Starlight Space',
  'Butterfly Garden',
  'Crystal Cave',
  'Bunny Village',
  'Star Kingdom',
  'Mushroom Forest',
  'Seashell Beach',
  'Carousel Kingdom',
  'Tropical Island',
  'Strawberry Village',
  'Heart Kingdom',
  'Ribbon Garden',
  'Tulip Valley',
  'Galaxy Garden',
  'Lotus Lake',
];
const originals = [
  ['🌟', 'Little Star', 'Common'],
  ['🌸', 'Pink Blossom', 'Common'],
  ['🍓', 'Strawberry', 'Common'],
  ['🎀', 'Pretty Bow', 'Common'],
  ['💎', 'Magic Gem', 'Rare'],
  ['🦄', 'Unicorn Friend', 'Rare'],
  ['👑', 'Princess Crown', 'Rare'],
  ['🐰', 'Royal Bunny', 'Rare'],
  ['🏰', 'Enchanted Castle', 'Super Rare'],
  ['🐉', 'Rainbow Dragon', 'Super Rare'],
  ['⭐', 'Legendary Star', 'Super Rare'],
  ['🦄🌈', 'Celestial Unicorn', 'Legendary'],
  ['👑✨', 'Starlight Crown', 'Legendary'],
] as const;
const themes = [
  ['🌸', 'Blossom'],
  ['🌈', 'Rainbow'],
  ['🌙', 'Moonlight'],
  ['🧚', 'Fairy'],
  ['🧁', 'Cupcake'],
  ['🐚', 'Seashell'],
  ['❄️', 'Snowflake'],
  ['🍓', 'Strawberry'],
  ['☁️', 'Cloud'],
  ['💫', 'Starlight'],
] as const;
const kinds = [
  ['🧿', 'Charm'],
  ['💎', 'Crystal'],
  ['🏮', 'Lantern'],
  ['👸', 'Tiara'],
  ['🪄', 'Wand'],
  ['🎵', 'Music Box'],
  ['🗝️', 'Key'],
  ['💝', 'Locket'],
  ['☕', 'Teacup'],
  ['🔮', 'Snow Globe'],
] as const;
export const TREASURES = [
  ...originals.map(([icon, name, rarity]) => ({ icon, name, rarity })),
  ...themes.flatMap(([themeIcon, theme], ti) =>
    kinds.map(([kindIcon, kind], ki) => ({
      icon: `${themeIcon}${kindIcon}`,
      name: `${theme} ${kind}`,
      rarity:
        ki === 9 && ti > 7
          ? 'Legendary'
          : ki > 7
            ? 'Super Rare'
            : ki > 4
              ? 'Rare'
              : 'Common',
    })),
  ),
];
export const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = <T>(items: T[]) =>
  items
    .map((v) => ({ v, n: Math.random() }))
    .sort((a, b) => a.n - b.n)
    .map((x) => x.v);
const choices = (answer: number, scale: number) =>
  shuffle([
    answer,
    ...Array.from(
      new Set(
        [1, -1, 2, -2, 5, -5, 10, -10, scale, -scale]
          .map((n) => answer + n)
          .filter((n) => n >= 0 && n !== answer),
      ),
    ).slice(0, 3),
  ]);
export function makeQuestion(
  mode: Mode,
  tables: number[],
  avoid = '',
): Question {
  let a = 2,
    b = 2,
    answer = 4,
    operator: Operator = '×';
  for (let i = 0; i < 8; i++) {
    if (mode.startsWith('addition')) {
      const range =
        mode === 'addition-easy'
          ? [1, 20]
          : mode === 'addition-medium'
            ? [10, 99]
            : [100, 999];
      a = rand(range[0], range[1]);
      b = rand(range[0], range[1]);
      operator = '+';
      answer = a + b;
    } else if (mode.startsWith('subtraction')) {
      const max =
        mode === 'subtraction-easy'
          ? 20
          : mode === 'subtraction-medium'
            ? 99
            : 999;
      a = rand(
        mode === 'subtraction-easy'
          ? 2
          : mode === 'subtraction-medium'
            ? 20
            : 100,
        max,
      );
      b = rand(1, a);
      operator = '−';
      answer = a - b;
    } else if (mode === 'table') {
      a = tables[rand(0, tables.length - 1)] ?? 2;
      b = rand(1, 10);
      answer = a * b;
    } else if (mode === '2x1') {
      a = rand(10, 99);
      b = rand(2, 9);
      answer = a * b;
    } else if (mode === '3x1') {
      a = rand(100, 999);
      b = rand(2, 9);
      answer = a * b;
    } else if (mode === '2x2') {
      a = rand(10, 99);
      b = rand(10, 99);
      answer = a * b;
    } else if (mode === '3x2') {
      a = rand(100, 999);
      b = rand(10, 99);
      answer = a * b;
    } else if (mode === 'division-table') {
      b = rand(1, 10);
      answer = rand(1, 10);
      a = b * answer;
      operator = '÷';
    } else {
      b = rand(2, mode === 'division-hard' ? 20 : 12);
      answer = rand(10, mode === 'division-hard' ? 99 : 40);
      a = b * answer;
      operator = '÷';
    }
    if (`${a}${operator}${b}` !== avoid) break;
  }
  return {
    a,
    b,
    answer,
    operator,
    options: choices(answer, Math.max(3, Math.round(Math.abs(answer) * 0.1))),
    key: `${a}${operator}${b}`,
  };
}
export function hintFor(q: Question, attempt: number) {
  if (q.operator === '+')
    return attempt < 3
      ? 'Start with the ones column, then carry if you need to. 🌸'
      : 'Add each place value carefully from right to left.';
  if (q.operator === '−')
    return attempt < 3
      ? 'Start with the ones column. Regroup when the top digit is smaller. 🌙'
      : 'Check each column from right to left.';
  if (q.operator === '÷')
    return attempt < 3
      ? `Think: what number multiplied by ${q.b} gives ${q.a}? 💎`
      : 'Use multiplication to check your quotient.';
  if (q.b < 10)
    return attempt < 3
      ? `Multiply ${q.a} by ${q.b} one place at a time. 🌸`
      : 'Check each carry before you add.';
  const ones = q.b % 10,
    tens = Math.floor(q.b / 10);
  return attempt === 2
    ? `Start by multiplying ${q.a} × ${ones}. 🌸`
    : attempt === 3
      ? `Now remember that the ${tens} in ${q.b} means ${tens * 10}.`
      : `Find ${q.a} × ${tens * 10}, then add your two partial answers.`;
}
export function pickTreasure(difficulty: 'easy' | 'medium' | 'hard' = 'easy') {
  const n = Math.random() * 100,
    rarity =
      difficulty === 'easy'
        ? 'Common'
        : difficulty === 'medium'
          ? n < 18
            ? 'Rare'
            : 'Common'
          : n < 3
            ? 'Legendary'
            : n < 15
              ? 'Super Rare'
              : n < 42
                ? 'Rare'
                : 'Common',
    pool = TREASURES.filter((t) => t.rarity === rarity);
  return pool[rand(0, pool.length - 1)];
}
