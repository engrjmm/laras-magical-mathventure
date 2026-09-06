export const MODES = {
  ADDITION: 'addition',
  SUBTRACTION: 'subtraction',
  TABLE: 'table',
  TWO_BY_ONE: '2x1',
  THREE_BY_ONE: '3x1',
  TWO_BY_TWO: '2x2',
  THREE_BY_TWO: '3x2',
  DIVISION_TABLE: 'division-table',
  DIVISION: 'division',
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
  }
> = {
  addition: {
    name: 'Addition Adventures',
    icon: '🌈',
    note: 'Add 1–3 digit numbers',
    workspace: true,
    subject: 'Addition',
  },
  subtraction: {
    name: 'Subtraction Adventures',
    icon: '🌙',
    note: 'Subtract with confidence',
    workspace: true,
    subject: 'Subtraction',
  },
  table: {
    name: 'Multiplication Tables',
    icon: '🌱',
    note: 'Facts from 1 to 10',
    workspace: false,
    subject: 'Multiplication',
  },
  '2x1': {
    name: '2-Digit × 1-Digit',
    icon: '🌸',
    note: 'A gentle next step',
    workspace: true,
    subject: 'Multiplication',
  },
  '3x1': {
    name: '3-Digit × 1-Digit',
    icon: '⭐',
    note: 'Bigger numbers, same magic',
    workspace: true,
    subject: 'Multiplication',
  },
  '2x2': {
    name: '2-Digit × 2-Digit',
    icon: '🦄',
    note: 'Practice partial products',
    workspace: true,
    subject: 'Multiplication',
  },
  '3x2': {
    name: '3-Digit × 2-Digit',
    icon: '👑',
    note: 'A royal challenge',
    workspace: true,
    subject: 'Multiplication',
  },
  'division-table': {
    name: 'Division Facts',
    icon: '🍓',
    note: 'Whole-number facts through 10',
    workspace: false,
    subject: 'Division',
  },
  division: {
    name: 'Division Workspace',
    icon: '💎',
    note: '2–3 digit whole-number division',
    workspace: true,
    subject: 'Division',
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
  'Charm',
  'Crystal',
  'Lantern',
  'Tiara',
  'Wand',
  'Music Box',
  'Key',
  'Locket',
  'Teacup',
  'Snow Globe',
] as const;
export const TREASURES = [
  ...originals.map(([icon, name, rarity]) => ({ icon, name, rarity })),
  ...themes.flatMap(([icon, theme], ti) =>
    kinds.map((kind, ki) => ({
      icon,
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
    if (mode === 'addition') {
      a = rand(10, 999);
      b = rand(10, 999);
      operator = '+';
      answer = a + b;
    } else if (mode === 'subtraction') {
      a = rand(20, 999);
      b = rand(10, a);
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
      b = rand(2, 12);
      answer = rand(10, 99);
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
export function pickTreasure() {
  const n = Math.random() * 100,
    rarity =
      n < 2 ? 'Legendary' : n < 12 ? 'Super Rare' : n < 38 ? 'Rare' : 'Common',
    pool = TREASURES.filter((t) => t.rarity === rarity);
  return pool[rand(0, pool.length - 1)];
}
