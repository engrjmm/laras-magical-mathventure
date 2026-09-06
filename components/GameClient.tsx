'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Camera,
  Check,
  ChevronRight,
  Gift,
  Home,
  Lightbulb,
  Settings,
  Shirt,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { DrawingCanvas } from './DrawingCanvas';
import {
  DEFAULT_SAVE,
  loadSave,
  storeSave,
  type SaveData,
} from '@/lib/storage';
import {
  hintFor,
  makeQuestion,
  MODE_INFO,
  pickTreasure,
  rand,
  TREASURES,
  WORLDS,
  type Mode,
  type Question,
} from '@/lib/game';
type View =
  | 'home'
  | 'modes'
  | 'play'
  | 'table-list'
  | 'treasures'
  | 'closet'
  | 'buddy'
  | 'profile'
  | 'settings';
const feedback = [
  'Correct, Lara! 🌟',
  'Amazing work! ✨',
  'Math magic! 💖',
  'Fantastic thinking! 🌈',
  'Superstar! ⭐',
];
const buddies = [
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
  buddyIcon: Record<string, string> = {
    Bunny: '🐰',
    Kitty: '🐱',
    Panda: '🐼',
    Unicorn: '🦄',
    Puppy: '🐶',
    Fox: '🦊',
    Chick: '🐥',
    Koala: '🐨',
    Hamster: '🐹',
    Otter: '🦦',
    Penguin: '🐧',
    Fawn: '🦌',
    Hedgehog: '🦔',
    'Red Panda': '🐾',
    Seal: '🦭',
    Owl: '🦉',
  };
const BUDDY_THRESHOLDS = buddies.map((name, index) => ({
  name,
  score: index === 0 ? 0 : index * 25,
}));
const buddiesForScore = (score: number) =>
  BUDDY_THRESHOLDS.filter((buddy) => score >= buddy.score).map(
    (buddy) => buddy.name,
  );
const accessories = [
    'Pretty Bow',
    'Princess Crown',
    'Flower Clip',
    'Magic Wand',
  ],
  accessoryIcon: Record<string, string> = {
    'Pretty Bow': '🎀',
    'Princess Crown': '👑',
    'Flower Clip': '🌸',
    'Magic Wand': '🪄',
  };
export function GameClient() {
  const [ready, setReady] = useState(false),
    [save, setSave] = useState<SaveData>(DEFAULT_SAVE),
    [view, setView] = useState<View>('home'),
    [q, setQ] = useState<Question>(),
    [attempts, setAttempts] = useState(0),
    [selectedAnswer, setSelectedAnswer] = useState<number | null>(null),
    [message, setMessage] = useState(''),
    [hint, setHint] = useState(''),
    [reward, setReward] = useState<ReturnType<typeof pickTreasure> | null>(
      null,
    ),
    [complete, setComplete] = useState(false),
    [resetOpen, setResetOpen] = useState(false),
    [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const s = loadSave();
    setSave(s);
    setQ(
      s.question ?? makeQuestion(s.practice.mode, s.practice.selectedTables),
    );
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) storeSave({ ...save, question: q });
  }, [save, q, ready]);
  const update = (fn: (s: SaveData) => SaveData) =>
    setSave((s) => fn(structuredClone(s)));
  const chooseMode = (mode: Mode) => {
    update((s) => {
      s.practice.mode = mode;
      return s;
    });
    setQ(makeQuestion(mode, save.practice.selectedTables));
    setAttempts(0);
    setSelectedAnswer(null);
    setMessage('');
    setHint('');
    setView('play');
  };
  const next = () => {
    setQ(
      makeQuestion(save.practice.mode, save.practice.selectedTables, q?.key),
    );
    setAttempts(0);
    setSelectedAnswer(null);
    setMessage('');
    setHint('');
  };
  const answer = (n: number) => {
    if (!q) return;
    setSelectedAnswer(n);
    if (n !== q.answer) {
      const a = attempts + 1;
      setAttempts(a);
      setMessage('Almost, Lara! 💛 Check your work and try again.');
      if (a >= 2) setHint(hintFor(q, a));
      update((s) => {
        s.player.currentStreak = 0;
        s.player.problemsSolved++;
        const st = s.practice.stats[s.practice.mode] ?? {
          attempts: 0,
          correct: 0,
        };
        st.attempts++;
        s.practice.stats[s.practice.mode] = st;
        return s;
      });
      return;
    }
    let showReward = false,
      done = false;
    update((s) => {
      s.player.totalCorrect++;
      s.customization.unlockedCompanions = buddiesForScore(
        s.player.totalCorrect,
      );
      s.player.problemsSolved++;
      s.player.currentStreak++;
      s.player.bestStreak = Math.max(
        s.player.bestStreak,
        s.player.currentStreak,
      );
      s.adventure.progress++;
      s.rewards.correctSinceLastReward++;
      const st = s.practice.stats[s.practice.mode] ?? {
        attempts: 0,
        correct: 0,
      };
      st.attempts++;
      st.correct++;
      s.practice.stats[s.practice.mode] = st;
      if (s.rewards.correctSinceLastReward >= s.rewards.nextRewardThreshold) {
        showReward = true;
        s.rewards.correctSinceLastReward = 0;
        s.rewards.nextRewardThreshold = rand(4, 7);
      }
      if (s.adventure.progress >= s.adventure.target) {
        done = true;
        s.adventure.adventuresCompleted++;
      }
      return s;
    });
    setMessage(feedback[rand(0, feedback.length - 1)]);
    setTimeout(
      () =>
        showReward
          ? setReward(pickTreasure(MODE_INFO[save.practice.mode].difficulty))
          : done
            ? setComplete(true)
            : next(),
      850,
    );
  };
  const addReward = () => {
    if (!reward) return;
    update((s) => {
      s.rewards.treasures[reward.name] =
        (s.rewards.treasures[reward.name] ?? 0) + 1;
      if (
        reward.name.includes('Crown') &&
        !s.customization.unlockedAccessories.includes('Princess Crown')
      )
        s.customization.unlockedAccessories.push('Princess Crown');
      return s;
    });
    setReward(null);
    next();
  };
  const nextAdventure = () => {
    update((s) => {
      s.adventure.number++;
      s.adventure.world = WORLDS[rand(0, WORLDS.length - 1)];
      s.adventure.progress = 0;
      s.adventure.target = rand(12, 20);
      return s;
    });
    setComplete(false);
    next();
  };
  const recordTableList = (correct: number, total: number) => {
    update((s) => {
      s.player.totalCorrect += correct;
      s.customization.unlockedCompanions = buddiesForScore(
        s.player.totalCorrect,
      );
      s.player.problemsSolved += total;
      s.player.currentStreak =
        correct === total ? s.player.currentStreak + correct : 0;
      s.player.bestStreak = Math.max(
        s.player.bestStreak,
        s.player.currentStreak,
      );
      s.adventure.progress = Math.min(
        s.adventure.target,
        s.adventure.progress + correct,
      );
      const stat = s.practice.stats['table-list'] ?? {
        attempts: 0,
        correct: 0,
      };
      stat.attempts += total;
      stat.correct += correct;
      s.practice.stats['table-list'] = stat;
      return s;
    });
  };
  const upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (
      !f ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(f.type) ||
      f.size > 4_000_000
    )
      return;
    const r = new FileReader();
    r.onload = () =>
      update((s) => {
        s.player.avatarType = 'photo';
        s.player.avatar = String(r.result);
        return s;
      });
    r.readAsDataURL(f);
  };
  if (!ready)
    return (
      <main className="loading">
        <div>✨</div>
        <h1>Opening Lara’s magical world...</h1>
      </main>
    );
  return (
    <main className="app-shell">
      <div className="sky-decor" aria-hidden>
        ✦　☁️　✧　🌙　✦　☁️
      </div>
      <header className="topbar">
        <button onClick={() => setView('home')} className="brand">
          Lara’s Magical Mathventure <span>✨</span>
          <small>Add • Subtract • Multiply • Divide • Collect</small>
        </button>
        <div className="top-stats">
          <span>⭐ {save.player.totalCorrect}</span>
          <span>🔥 {save.player.currentStreak}</span>
          <button
            aria-label="Toggle sound effects"
            onClick={() =>
              update((s) => {
                s.settings.soundEffects = !s.settings.soundEffects;
                return s;
              })
            }
          >
            {save.settings.soundEffects ? <Volume2 /> : <VolumeX />}
          </button>
        </div>
      </header>
      {view === 'home' && <HomeView save={save} go={setView} />}{' '}
      {view === 'modes' && (
        <Modes
          save={save}
          choose={chooseMode}
          openTableList={() => setView('table-list')}
          update={update}
          back={() => setView('home')}
        />
      )}{' '}
      {view === 'table-list' && (
        <TimesTableList
          tables={save.practice.selectedTables}
          back={() => setView('modes')}
          record={recordTableList}
        />
      )}{' '}
      {view === 'play' && q && (
        <Play
          save={save}
          q={q}
          attempts={attempts}
          selectedAnswer={selectedAnswer}
          message={message}
          hint={hint}
          answer={answer}
          back={() => setView('modes')}
        />
      )}{' '}
      {view === 'treasures' && (
        <Treasures save={save} back={() => setView('home')} />
      )}{' '}
      {view === 'closet' && (
        <Closet save={save} update={update} back={() => setView('home')} />
      )}{' '}
      {view === 'buddy' && (
        <Buddy save={save} update={update} back={() => setView('home')} />
      )}{' '}
      {view === 'profile' && (
        <Profile save={save} back={() => setView('home')} />
      )}{' '}
      {view === 'settings' && (
        <SettingsView
          save={save}
          update={update}
          back={() => setView('home')}
          upload={() => fileRef.current?.click()}
          cartoon={() =>
            update((s) => {
              s.player.avatarType = 'default';
              delete s.player.avatar;
              return s;
            })
          }
          reset={() => setResetOpen(true)}
        />
      )}
      <input
        ref={fileRef}
        className="hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={upload}
      />
      <Dialog open={!!reward} onOpenChange={() => {}}>
        <DialogContent className="reward-modal" showCloseButton={false}>
          <div className="gift-pop">🎁</div>
          <DialogHeader>
            <DialogTitle>✨ You found something!</DialogTitle>
            <DialogDescription>
              A magical surprise joined your collection, Lara.
            </DialogDescription>
          </DialogHeader>
          {reward && (
            <div
              className={`reward-reveal ${reward.rarity.replace(' ', '-').toLowerCase()}`}
            >
              <span>{reward.icon}</span>
              <h2>{reward.name}</h2>
              <b>{reward.rarity}</b>
            </div>
          )}
          <Button className="magic-button" onClick={addReward}>
            💖 Add to My Treasures
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={complete} onOpenChange={() => {}}>
        <DialogContent className="reward-modal" showCloseButton={false}>
          <div className="gift-pop">👑✨</div>
          <DialogHeader>
            <DialogTitle>Adventure Complete!</DialogTitle>
            <DialogDescription>
              Lara explored the {save.adventure.world}! You can keep adventuring
              forever.
            </DialogDescription>
          </DialogHeader>
          <Button className="magic-button" onClick={nextAdventure}>
            🌈 Start My Next Adventure
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmReset
                ? 'This cannot be undone.'
                : 'Start a brand-new Mathventure?'}
            </DialogTitle>
            <DialogDescription>
              {confirmReset
                ? 'This will erase Lara’s adventures, treasures, avatar settings and learning progress stored on this device.'
                : 'You’ll be asked once more before anything is erased.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetOpen(false);
                setConfirmReset(false);
              }}
            >
              Cancel
            </Button>
            {confirmReset ? (
              <Button
                variant="destructive"
                onClick={() => {
                  localStorage.removeItem('lara-mathventure-v1');
                  setSave(structuredClone(DEFAULT_SAVE));
                  setQ(
                    makeQuestion('table', DEFAULT_SAVE.practice.selectedTables),
                  );
                  setResetOpen(false);
                  setConfirmReset(false);
                  setView('home');
                }}
              >
                Yes, Start Fresh
              </Button>
            ) : (
              <Button onClick={() => setConfirmReset(true)}>Continue</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
function Avatar({
  save,
  size = 'large',
}: {
  save: SaveData;
  size?: 'large' | 'small';
}) {
  return (
    <div className={`avatar ${size}`}>
      {save.player.avatarType === 'photo' && save.player.avatar ? (
        <img src={save.player.avatar} alt="Lara’s uploaded avatar" />
      ) : (
        <span role="img" aria-label="Lara’s cute cartoon adventurer avatar">
          👧🏻
        </span>
      )}
      {save.customization.equippedAccessory && (
        <i>{accessoryIcon[save.customization.equippedAccessory]}</i>
      )}
    </div>
  );
}
function HomeView({ save, go }: { save: SaveData; go: (v: View) => void }) {
  return (
    <section className="page home-page">
      <div className="hero-card">
        <div className="avatar-scene">
          <span className="float one">🦋</span>
          <span className="float two">🌸</span>
          <Avatar save={save} />
          {save.customization.selectedCompanion && (
            <span className="buddy-float">
              {buddyIcon[save.customization.selectedCompanion]}
            </span>
          )}
        </div>
        <div className="hero-copy">
          <p className="eyebrow">Welcome back, Lara! 💖</p>
          <h1>Your next little wonder is waiting.</h1>
          <div className="adventure-card">
            <b>🌸 ADVENTURE #{save.adventure.number}</b>
            <h2>{save.adventure.world}</h2>
            <div className="trail">
              <span>👧🏻</span>
              <div>
                <i
                  style={{
                    width: `${Math.min(100, (save.adventure.progress / save.adventure.target) * 100)}%`,
                  }}
                />
              </div>
              <span>🎁</span>
              <span>🏰</span>
            </div>
          </div>
          <button className="magic-button" onClick={() => go('modes')}>
            ✨ Continue My Adventure
          </button>
        </div>
      </div>
      <aside>
        <button onClick={() => go('modes')} className="side-card yellow">
          <span>🌈</span>
          <b>Practice & explore</b>
          <small>Add, subtract, multiply, or divide. Nothing is locked.</small>
        </button>
        <button onClick={() => go('buddy')} className="side-card mint">
          <span>
            {save.customization.selectedCompanion
              ? buddyIcon[save.customization.selectedCompanion]
              : '🐰'}
          </span>
          <b>Your buddy is ready!</b>
          <small>Cheering you on every step.</small>
        </button>
      </aside>
      <nav className="main-menu">
        {[
          [Sparkles, 'Practice', 'modes'],
          [Gift, 'Treasure Book', 'treasures'],
          [Shirt, 'My Closet', 'closet'],
          [Star, 'Adventure Buddy', 'buddy'],
          [BookOpen, 'Lara’s Profile', 'profile'],
          [Settings, 'Settings', 'settings'],
        ].map(([Icon, label, to], i) => {
          const C = Icon as typeof Home;
          return (
            <button
              key={label as string}
              data-n={i}
              onClick={() => go(to as View)}
            >
              <C />
              <b>{label as string}</b>
              <ChevronRight />
            </button>
          );
        })}
      </nav>
    </section>
  );
}
function Modes({
  save,
  choose,
  openTableList,
  update,
  back,
}: {
  save: SaveData;
  choose: (m: Mode) => void;
  openTableList: () => void;
  update: (f: (s: SaveData) => SaveData) => void;
  back: () => void;
}) {
  return (
    <section className="page inner-page">
      <button className="back" onClick={back}>
        <ArrowLeft /> Home
      </button>
      <div className="section-heading">
        <span>🌈</span>
        <div>
          <p className="eyebrow">Choose your path</p>
          <h1>What shall we practice?</h1>
          <p>Every adventure is open, Lara. Take all the time you need.</p>
        </div>
      </div>
      <div className="subject-sections">
        {[
          ['Addition', '🌈'],
          ['Subtraction', '🌙'],
          ['Multiplication', '🦄'],
          ['Division', '💎'],
        ].map(([subject, icon]) => (
          <section className="subject-card" key={subject}>
            <div className="subject-title">
              <span>{icon}</span>
              <div>
                <h2>{subject}</h2>
                <p>Choose a level and start exploring.</p>
              </div>
            </div>
            <div className="mode-grid">
              {Object.entries(MODE_INFO)
                .filter(([, m]) => m.subject === subject)
                .map(([key, m]) => (
                  <button
                    key={key}
                    data-difficulty={m.difficulty}
                    onClick={() => choose(key as Mode)}
                  >
                    <span>{m.icon}</span>
                    <div>
                      <h2>{m.name}</h2>
                      <p>{m.note}</p>
                    </div>
                    <ChevronRight />
                  </button>
                ))}
              {subject === 'Multiplication' && (
                <button className="table-list-card" onClick={openTableList}>
                  <span>✍️</span>
                  <div>
                    <h2>Written Table List</h2>
                    <p>Write all ten answers by hand</p>
                  </div>
                  <ChevronRight />
                </button>
              )}
            </div>
          </section>
        ))}
      </div>
      <div className="table-picker">
        <div>
          <h2>✨ Pick your tables</h2>
          <p>Choose one, several, or try Adventure Mix.</p>
        </div>
        <div className="table-buttons">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              className={
                save.practice.selectedTables.includes(n) ? 'selected' : ''
              }
              onClick={() =>
                update((s) => {
                  const has = s.practice.selectedTables.includes(n);
                  s.practice.selectedTables = has
                    ? s.practice.selectedTables.filter((x) => x !== n)
                    : [...s.practice.selectedTables, n].sort((a, b) => a - b);
                  if (!s.practice.selectedTables.length)
                    s.practice.selectedTables = [n];
                  return s;
                })
              }
            >
              ×{n}
            </button>
          ))}
          <button
            className="mix"
            onClick={() =>
              update((s) => {
                s.practice.selectedTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                return s;
              })
            }
          >
            🌈 Adventure Mix
          </button>
        </div>
      </div>
    </section>
  );
}
function TimesTableList({
  tables,
  back,
  record,
}: {
  tables: number[];
  back: () => void;
  record: (correct: number, total: number) => void;
}) {
  const [table, setTable] = useState(tables[0] ?? 2);
  const [showKey, setShowKey] = useState(false);
  const [recordedScore, setRecordedScore] = useState<number | null>(null);
  const reset = (nextTable = table) => {
    setTable(nextTable);
    setShowKey(false);
    setRecordedScore(null);
  };
  return (
    <section className="page inner-page table-list-page">
      <button className="back" onClick={back}>
        <ArrowLeft /> Modes
      </button>
      <div className="section-heading">
        <span>📝</span>
        <div>
          <p className="eyebrow">Multiplication practice</p>
          <h1>Table List Challenge</h1>
          <p>
            Write every answer by hand, then use the answer key to self-check.
          </p>
        </div>
      </div>
      <div className="list-table-picker">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            className={table === n ? 'selected' : ''}
            onClick={() => reset(n)}
          >
            ×{n}
          </button>
        ))}
      </div>
      <DrawingCanvas
        worksheetTable={table}
        worksheetShowAnswers={showKey}
        large
        resetKey={`table-list-${table}-${recordedScore ?? 'new'}`}
      />
      {!showKey ? (
        <button
          className="magic-button check-list"
          onClick={() => setShowKey(true)}
        >
          ✨ Submit Answers
        </button>
      ) : (
        <div className="written-check">
          <h2>Answers submitted!</h2>
          <p>The correct answer is now beside each handwriting box.</p>
          {recordedScore === null ? (
            <>
              <p>Compare your handwriting. How many did you get right?</p>
              <div className="self-score">
                {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setRecordedScore(n);
                      record(n, 10);
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="list-result">
              <strong>{recordedScore}/10</strong>
              <span>Score saved! Wonderful honest checking, Lara. 💖</span>
              <button className="magic-button" onClick={() => reset()}>
                Try This Table Again
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Play({
  save,
  q,
  attempts,
  selectedAnswer,
  message,
  hint,
  answer,
  back,
}: {
  save: SaveData;
  q: Question;
  attempts: number;
  selectedAnswer: number | null;
  message: string;
  hint: string;
  answer: (n: number) => void;
  back: () => void;
}) {
  const advanced = MODE_INFO[save.practice.mode].workspace;
  const answerPanel = (
    <div
      className={`answer-zone ${advanced ? 'compact-answers answer-zone-above' : ''}`}
    >
      <h2>🌟 What’s your final answer?</h2>
      <div className="answers">
        {q.options.map((n) => (
          <button
            key={n}
            className={selectedAnswer === n ? 'selected' : ''}
            aria-pressed={selectedAnswer === n}
            onClick={() => answer(n)}
          >
            {n}
          </button>
        ))}
      </div>
      {message && (
        <p
          className={message.startsWith('Almost') ? 'encourage' : 'success'}
          aria-live="polite"
        >
          {message}
        </p>
      )}
      {attempts >= 2 && (
        <div className="hint">
          <Lightbulb />
          <div>
            <b>Need a Hint?</b>
            <p>{hint}</p>
          </div>
        </div>
      )}
    </div>
  );
  return (
    <section className="page play-page">
      <div className="play-head">
        <button className="back" onClick={back}>
          <ArrowLeft /> Modes
        </button>
        <div>
          <b>Adventure #{save.adventure.number}</b>
          <span>{save.adventure.world}</span>
        </div>
        <div className="play-progress">
          <span>👧🏻</span>
          <div>
            <i
              style={{
                width: `${(save.adventure.progress / save.adventure.target) * 100}%`,
              }}
            />
          </div>
          <span>🏰</span>
        </div>
      </div>
      <div className="problem-card">
        <p className="eyebrow">
          {MODE_INFO[save.practice.mode].icon}{' '}
          {MODE_INFO[save.practice.mode].name}
        </p>
        {advanced ? null : (
          <div className="flash-problem">
            {q.a} {q.operator} {q.b} = ?
          </div>
        )}
        {advanced && answerPanel}
        {advanced && (
          <DrawingCanvas
            a={q.a}
            b={q.b}
            operator={q.operator}
            large={save.practice.mode === '3x2' || q.a >= 100}
            resetKey={q.key}
          />
        )}
        {!advanced && answerPanel}
      </div>
    </section>
  );
}
function Treasures({ save, back }: { save: SaveData; back: () => void }) {
  const found = Object.keys(save.rewards.treasures).length;
  return (
    <section className="page inner-page">
      <button className="back" onClick={back}>
        <ArrowLeft /> Home
      </button>
      <div className="section-heading">
        <span>📖</span>
        <div>
          <p className="eyebrow">Lara’s collection</p>
          <h1>Magical Treasure Book</h1>
          <p>
            {found} / {TREASURES.length} treasures discovered
          </p>
        </div>
      </div>
      <div className="treasure-grid">
        {TREASURES.map((t) => {
          const n = save.rewards.treasures[t.name] ?? 0;
          return (
            <div key={t.name} className={n ? 'found' : ''}>
              <span>{n ? t.icon : '❓'}</span>
              <b>{n ? t.name : 'Mystery Treasure'}</b>
              <small>{n ? `${t.rarity} · × ${n}` : 'Keep exploring!'}</small>
            </div>
          );
        })}
      </div>
    </section>
  );
}
function Closet({
  save,
  update,
  back,
}: {
  save: SaveData;
  update: (f: (s: SaveData) => SaveData) => void;
  back: () => void;
}) {
  return (
    <Picker
      title="My Closet"
      icon="🎀"
      note="Choose something magical for Lara to wear."
      back={back}
      preview={<Avatar save={save} />}
      items={accessories}
      unlocked={save.customization.unlockedAccessories}
      selected={save.customization.equippedAccessory}
      icons={accessoryIcon}
      choose={(x) =>
        update((s) => {
          s.customization.equippedAccessory = x;
          return s;
        })
      }
    />
  );
}
function Buddy({
  save,
  update,
  back,
}: {
  save: SaveData;
  update: (f: (s: SaveData) => SaveData) => void;
  back: () => void;
}) {
  return (
    <Picker
      title="My Adventure Buddy"
      icon="💖"
      note="Earn correct answers to unlock each new friend."
      back={back}
      preview={
        <div className="buddy-preview">
          <Avatar save={save} />
          <span>
            {save.customization.selectedCompanion
              ? buddyIcon[save.customization.selectedCompanion]
              : '✨'}
          </span>
        </div>
      }
      items={buddies}
      unlocked={buddiesForScore(save.player.totalCorrect)}
      unlockScores={Object.fromEntries(
        BUDDY_THRESHOLDS.map((b) => [b.name, b.score]),
      )}
      selected={save.customization.selectedCompanion}
      icons={buddyIcon}
      choose={(x) =>
        update((s) => {
          s.customization.selectedCompanion = x;
          return s;
        })
      }
    />
  );
}
function Picker({
  title,
  icon,
  note,
  back,
  preview,
  items,
  unlocked,
  unlockScores,
  selected,
  icons,
  choose,
}: {
  title: string;
  icon: string;
  note: string;
  back: () => void;
  preview: React.ReactNode;
  items: string[];
  unlocked: string[];
  unlockScores?: Record<string, number>;
  selected: string | null;
  icons: Record<string, string>;
  choose: (x: string) => void;
}) {
  return (
    <section className="page inner-page">
      <button className="back" onClick={back}>
        <ArrowLeft /> Home
      </button>
      <div className="section-heading">
        <span>{icon}</span>
        <div>
          <p className="eyebrow">Make it yours</p>
          <h1>{title}</h1>
          <p>{note}</p>
        </div>
      </div>
      <div className="picker-layout">
        <div className="picker-preview">{preview}</div>
        <div className="picker-grid">
          {items.map((x) => {
            const open = unlocked.includes(x);
            return (
              <button
                key={x}
                disabled={!open}
                className={selected === x ? 'selected' : ''}
                onClick={() => choose(x)}
              >
                <span>{open ? icons[x] : '🔒'}</span>
                <b>{x}</b>
                <small>
                  {open
                    ? selected === x
                      ? 'Equipped'
                      : 'Tap to choose'
                    : unlockScores?.[x] !== undefined
                      ? `Unlock at ${unlockScores[x]} correct`
                      : 'Find this treasure'}
                </small>
                {selected === x && <Check />}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
function Profile({ save, back }: { save: SaveData; back: () => void }) {
  const unique = Object.keys(save.rewards.treasures).length,
    total = Object.values(save.rewards.treasures).reduce((a, b) => a + b, 0);
  return (
    <section className="page inner-page">
      <button className="back" onClick={back}>
        <ArrowLeft /> Home
      </button>
      <div className="profile-head">
        <Avatar save={save} />
        <div>
          <p className="eyebrow">Lara’s Profile 💖</p>
          <h1>Magical Math Explorer</h1>
          <p>
            Adventure #{save.adventure.number} · {save.adventure.world}
          </p>
        </div>
      </div>
      <div className="stats-grid">
        {[
          ['⭐', 'Total Correct', save.player.totalCorrect],
          ['🔥', 'Best Streak', save.player.bestStreak],
          ['🎁', 'Total Treasures', total],
          ['💎', 'Unique Treasures', unique],
          ['🗺️', 'Adventures', save.adventure.adventuresCompleted],
          ['✨', 'Problems Solved', save.player.problemsSolved],
        ].map(([i, l, v]) => (
          <div key={l as string}>
            <span>{i}</span>
            <strong>{v}</strong>
            <small>{l}</small>
          </div>
        ))}
      </div>
      <h2 className="subheading">Practice by mode</h2>
      <div className="mode-stats">
        {Object.entries(MODE_INFO).map(([k, m]) => {
          const st = save.practice.stats[k] ?? { attempts: 0, correct: 0 };
          return (
            <div key={k}>
              <span>{m.icon}</span>
              <b>{m.name}</b>
              <small>{st.correct} solved</small>
            </div>
          );
        })}
      </div>
    </section>
  );
}
function SettingsView({
  save,
  update,
  back,
  upload,
  cartoon,
  reset,
}: {
  save: SaveData;
  update: (f: (s: SaveData) => SaveData) => void;
  back: () => void;
  upload: () => void;
  cartoon: () => void;
  reset: () => void;
}) {
  return (
    <section className="page inner-page settings-page">
      <button className="back" onClick={back}>
        <ArrowLeft /> Home
      </button>
      <div className="section-heading">
        <span>⚙️</span>
        <div>
          <p className="eyebrow">Grown-ups can help here</p>
          <h1>Settings</h1>
          <p>Everything is saved only on this device.</p>
        </div>
      </div>
      <div className="settings-card">
        <h2>Lara’s avatar</h2>
        <div className="avatar-setting">
          <Avatar save={save} />
          <div>
            <Button onClick={upload}>
              <Camera /> Use My Photo
            </Button>
            <Button variant="outline" onClick={cartoon}>
              🌸 Use Cute Cartoon Avatar
            </Button>
            <p>JPG, PNG or WEBP. Photos never leave this device.</p>
          </div>
        </div>
        <hr />
        <label>
          <span>
            <b>🔊 Sound Effects</b>
            <small>Soft sparkles and magical chimes</small>
          </span>
          <Switch
            checked={save.settings.soundEffects}
            onCheckedChange={(v) =>
              update((s) => {
                s.settings.soundEffects = v;
                return s;
              })
            }
          />
        </label>
        <label>
          <span>
            <b>🎵 Background Music</b>
            <small>Gentle adventure music</small>
          </span>
          <Switch
            checked={save.settings.music}
            onCheckedChange={(v) =>
              update((s) => {
                s.settings.music = v;
                return s;
              })
            }
          />
        </label>
        <hr />
        <div className="reset-row">
          <div>
            <b>Start Fresh</b>
            <p>Erase progress stored on this device.</p>
          </div>
          <Button variant="destructive" onClick={reset}>
            Start Fresh
          </Button>
        </div>
      </div>
    </section>
  );
}
