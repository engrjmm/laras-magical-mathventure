'use client';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
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
  UserRound,
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
import { getCloudClient, type ChildProfile } from '@/lib/cloud';
type View =
  | 'home'
  | 'modes'
  | 'play'
  | 'table-list'
  | 'treasures'
  | 'closet'
  | 'buddy'
  | 'profile'
  | 'account'
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
    [confirmReset, setConfirmReset] = useState(false),
    [authChecked, setAuthChecked] = useState(false),
    [cloudUser, setCloudUser] = useState<User | null>(null),
    [profiles, setProfiles] = useState<ChildProfile[]>([]),
    [activeProfileId, setActiveProfileId] = useState<string | null>(null),
    [cloudMessage, setCloudMessage] = useState('');
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
  useEffect(() => {
    if (ready)
      document.title = save.player.name
        ? `${save.player.name}'s Magical Mathventure`
        : 'Magical Mathventure';
  }, [ready, save.player.name]);
  useEffect(() => {
    const cloud = getCloudClient();
    if (!cloud) {
      setAuthChecked(true);
      return;
    }
    cloud.auth.getUser().then(({ data }) => {
      setCloudUser(data.user);
      setAuthChecked(true);
    });
    const { data } = cloud.auth.onAuthStateChange((_event, session) => {
      setCloudUser(session?.user ?? null);
      setAuthChecked(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    const cloud = getCloudClient();
    if (!cloudUser || !cloud) {
      setProfiles([]);
      setActiveProfileId(null);
      return;
    }
    cloud
      .from('child_profiles')
      .select('*')
      .order('created_at')
      .then(({ data, error }) => {
        if (error) return setCloudMessage(error.message);
        const rows = (data ?? []) as ChildProfile[];
        if (!rows.length) {
          const local = loadSave();
          cloud
            .from('child_profiles')
            .insert({
              parent_id: cloudUser.id,
              name: local.player.name || 'Child',
              save_data: local,
            })
            .select('*')
            .single()
            .then(({ data: created, error: createError }) => {
              if (createError) return setCloudMessage(createError.message);
              const profile = created as ChildProfile;
              setProfiles([profile]);
              setSave(profile.save_data);
              setActiveProfileId(profile.id);
              localStorage.setItem('lara-active-cloud-profile', profile.id);
              setCloudMessage('Your child profile is saved to the cloud ✓');
            });
          return;
        }
        setProfiles(rows);
        const remembered = localStorage.getItem('lara-active-cloud-profile');
        const chosen = rows.find((p) => p.id === remembered) ?? rows[0];
        if (chosen) {
          setSave(chosen.save_data);
          setQ(
            chosen.save_data.question ??
              makeQuestion(
                chosen.save_data.practice.mode,
                chosen.save_data.practice.selectedTables,
              ),
          );
          setActiveProfileId(chosen.id);
          localStorage.setItem('lara-active-cloud-profile', chosen.id);
        }
      });
  }, [cloudUser]);
  useEffect(() => {
    const cloud = getCloudClient();
    if (!ready || !cloudUser || !activeProfileId || !cloud) return;
    const timer = window.setTimeout(async () => {
      const { error } = await cloud
        .from('child_profiles')
        .update({
          name: save.player.name,
          save_data: { ...save, question: q },
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeProfileId);
      setCloudMessage(error ? error.message : 'Progress saved to the cloud ✓');
    }, 900);
    return () => window.clearTimeout(timer);
  }, [save, q, ready, cloudUser, activeProfileId]);
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
  const authenticate = async (
    email: string,
    password: string,
    register: boolean,
  ) => {
    const cloud = getCloudClient();
    if (!cloud) return setCloudMessage('Cloud setup is not connected yet.');
    setCloudMessage('Please wait…');
    const result = register
      ? await cloud.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
      : await cloud.auth.signInWithPassword({ email, password });
    setCloudMessage(
      result.error
        ? result.error.message
        : register && !result.data.session
          ? 'Check your email to confirm the new parent account.'
          : 'Signed in successfully.',
    );
  };
  const createChildProfile = async (name: string) => {
    const cloud = getCloudClient();
    if (!cloud || !cloudUser || !name.trim()) return;
    const childSave = structuredClone(save);
    childSave.player.name = name.trim();
    const { data, error } = await cloud
      .from('child_profiles')
      .insert({
        parent_id: cloudUser.id,
        name: name.trim(),
        save_data: { ...childSave, question: q },
      })
      .select('*')
      .single();
    if (error) return setCloudMessage(error.message);
    const profile = data as ChildProfile;
    setProfiles((items) => [...items, profile]);
    setSave(childSave);
    setActiveProfileId(profile.id);
    localStorage.setItem('lara-active-cloud-profile', profile.id);
    setCloudMessage(
      `${profile.name}’s current device progress is now in the cloud ✓`,
    );
  };
  const selectChildProfile = (profile: ChildProfile) => {
    setSave(profile.save_data);
    setQ(
      profile.save_data.question ??
        makeQuestion(
          profile.save_data.practice.mode,
          profile.save_data.practice.selectedTables,
        ),
    );
    setActiveProfileId(profile.id);
    localStorage.setItem('lara-active-cloud-profile', profile.id);
    setCloudMessage(`Using ${profile.name}’s profile`);
  };
  const signOut = async () => {
    await getCloudClient()?.auth.signOut();
    setCloudMessage('Signed out. Progress remains saved on this device.');
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
  if (!ready || !authChecked)
    return (
      <main className="loading">
        <div>✨</div>
        <h1>Opening Magical Mathventure...</h1>
      </main>
    );
  if (getCloudClient() && !cloudUser)
    return <LoginGate authenticate={authenticate} message={cloudMessage} />;
  return (
    <main className="app-shell">
      <div className="sky-decor" aria-hidden>
        ✦　☁️　✧　🌙　✦　☁️
      </div>
      <header className="topbar">
        <button onClick={() => setView('home')} className="brand">
          {save.player.name
            ? `${save.player.name}'s Magical Mathventure`
            : 'Magical Mathventure'}{' '}
          <span>✨</span>
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
      {view === 'account' && (
        <AccountView
          configured={Boolean(getCloudClient())}
          user={cloudUser}
          profiles={profiles}
          currentSave={save}
          activeProfileId={activeProfileId}
          message={cloudMessage}
          back={() => setView('home')}
          authenticate={authenticate}
          createProfile={createChildProfile}
          selectProfile={selectChildProfile}
          signOut={signOut}
        />
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
function LoginGate({
  authenticate,
  message,
}: {
  authenticate: (
    email: string,
    password: string,
    register: boolean,
  ) => Promise<void>;
  message: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-mark">🧠</div>
        <p className="eyebrow">Welcome to</p>
        <h1>Magical Mathventure</h1>
        <p>Sign in to continue your child’s learning adventure.</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void authenticate(email.trim(), password, false);
          }}
        >
          <label>
            Parent email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              minLength={8}
              required
            />
          </label>
          <button className="magic-button" type="submit">
            Sign In
          </button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void authenticate(email.trim(), password, true)}
          >
            Create Parent Account
          </Button>
        </form>
        {message && <p className="cloud-message">{message}</p>}
      </section>
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
          <p className="eyebrow">Welcome back, {save.player.name}! 💖</p>
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
          [BookOpen, `${save.player.name}'s Profile`, 'profile'],
          [UserRound, 'Parent Account', 'account'],
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
        <span>🧠</span>
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
  const operations = [
    { name: 'Addition', icon: '➕', subject: 'addition' },
    { name: 'Subtraction', icon: '➖', subject: 'subtraction' },
    { name: 'Multiplication', icon: '✖️', subject: 'multiplication' },
    { name: 'Division', icon: '➗', subject: 'division' },
  ] as const;
  return (
    <section className="page inner-page">
      <button className="back" onClick={back}>
        <ArrowLeft /> Home
      </button>
      <div className="profile-head">
        <Avatar save={save} />
        <div>
          <p className="eyebrow">{save.player.name}&apos;s Profile 💖</p>
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
      <h2 className="subheading">Practice by operation</h2>
      <div className="operation-stats">
        {operations.map((operation) => {
          const modes = Object.entries(MODE_INFO).filter(
            ([, mode]) => mode.subject === operation.subject,
          );
          return (
            <section className="operation-group" key={operation.subject}>
              <div className="operation-heading">
                <span>{operation.icon}</span>
                <h3>{operation.name}</h3>
              </div>
              <div className="mode-stats">
                {modes.map(([key, mode]) => {
                  const stat = save.practice.stats[key] ?? {
                    attempts: 0,
                    correct: 0,
                  };
                  return (
                    <div key={key}>
                      <span>{mode.icon}</span>
                      <b>{mode.name}</b>
                      <small>
                        {stat.correct} correct · {stat.attempts} attempts
                      </small>
                    </div>
                  );
                })}
                {operation.subject === 'multiplication' && (
                  <div>
                    <span>📝</span>
                    <b>Written Table List</b>
                    <small>
                      {save.practice.stats['table-list']?.correct ?? 0} correct
                      {' · '}
                      {save.practice.stats['table-list']?.attempts ?? 0}{' '}
                      attempts
                    </small>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
function AccountView({
  configured,
  user,
  profiles,
  currentSave,
  activeProfileId,
  message,
  back,
  authenticate,
  createProfile,
  selectProfile,
  signOut,
}: {
  configured: boolean;
  user: User | null;
  profiles: ChildProfile[];
  currentSave: SaveData;
  activeProfileId: string | null;
  message: string;
  back: () => void;
  authenticate: (
    email: string,
    password: string,
    register: boolean,
  ) => Promise<void>;
  createProfile: (name: string) => Promise<void>;
  selectProfile: (profile: ChildProfile) => void;
  signOut: () => Promise<void>;
}) {
  type Payment = {
    id: string;
    parent_id: string;
    amount: number;
    gcash_reference: string;
    status: 'pending' | 'approved' | 'rejected';
    submitted_at: string;
  };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [childName, setChildName] = useState('Lara');
  const [gcashReference, setGcashReference] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const isAdmin = false;
  const activeSave = activeProfileId ? currentSave : null;
  const subjectSummary = (subject: string) => {
    const matches = (mode: string) =>
      subject === 'Addition'
        ? mode.startsWith('addition')
        : subject === 'Subtraction'
          ? mode.startsWith('subtraction')
          : subject === 'Division'
            ? mode.startsWith('division')
            : !mode.startsWith('addition') &&
              !mode.startsWith('subtraction') &&
              !mode.startsWith('division');
    return Object.entries(activeSave?.practice.stats ?? {}).reduce(
      (total, [mode, stat]) =>
        matches(mode)
          ? {
              attempts: total.attempts + stat.attempts,
              correct: total.correct + stat.correct,
            }
          : total,
      { attempts: 0, correct: 0 },
    );
  };
  const submit = (event: FormEvent, register: boolean) => {
    event.preventDefault();
    void authenticate(email.trim(), password, register);
  };
  const refreshPayments = async () => {
    const cloud = getCloudClient();
    if (!cloud || !user) return;
    const { data } = await cloud
      .from('subscription_payments')
      .select('*')
      .order('submitted_at', { ascending: false });
    setPayments((data ?? []) as Payment[]);
  };
  useEffect(() => {
    void refreshPayments();
  }, [user?.id]);
  const submitPayment = async (event: FormEvent) => {
    event.preventDefault();
    const cloud = getCloudClient();
    if (!cloud || !user) return;
    const { error } = await cloud.from('subscription_payments').insert({
      parent_id: user.id,
      amount: 300,
      gcash_reference: gcashReference.trim(),
    });
    if (!error) {
      setGcashReference('');
      await refreshPayments();
    }
  };
  const reviewPayment = async (id: string, status: 'approved' | 'rejected') => {
    const cloud = getCloudClient();
    if (!cloud || !isAdmin) return;
    await cloud
      .from('subscription_payments')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    await refreshPayments();
  };
  return (
    <section className="page inner-page account-page">
      <button className="back" onClick={back}>
        <ArrowLeft /> Home
      </button>
      <div className="section-heading">
        <span>☁️</span>
        <div>
          <p className="eyebrow">For parents and guardians</p>
          <h1>Family Progress</h1>
          <p>Save learning progress online and use it across devices.</p>
        </div>
      </div>
      {!configured ? (
        <div className="account-card setup-needed">
          <h2>Cloud connection needed</h2>
          <p>
            The account screens are ready. Connect this site to a Supabase
            project to activate registration and cloud saving.
          </p>
        </div>
      ) : !user ? (
        <form
          className="account-card auth-form"
          onSubmit={(e) => submit(e, false)}
        >
          <h2>Parent sign in</h2>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              autoComplete="current-password"
            />
          </label>
          <div className="account-actions">
            <button className="magic-button" type="submit">
              Sign In
            </button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void authenticate(email.trim(), password, true)}
            >
              Create Account
            </Button>
          </div>
        </form>
      ) : (
        <div className="account-card">
          <div className="account-head">
            <div>
              <small>Signed in as</small>
              <b>{user.email}</b>
            </div>
            <Button variant="outline" onClick={() => void signOut()}>
              Sign Out
            </Button>
          </div>
          {isAdmin ? (
            <section className="admin-dashboard">
              <p className="eyebrow">Administrator dashboard</p>
              <h2>GCash payment reviews</h2>
              {payments.length ? (
                <div className="payment-list">
                  {payments.map((payment) => (
                    <div key={payment.id}>
                      <span>
                        <b>₱{payment.amount}</b>
                        <small>{payment.gcash_reference}</small>
                      </span>
                      <strong data-status={payment.status}>
                        {payment.status}
                      </strong>
                      {payment.status === 'pending' && (
                        <span className="review-actions">
                          <button
                            onClick={() =>
                              void reviewPayment(payment.id, 'approved')
                            }
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              void reviewPayment(payment.id, 'rejected')
                            }
                          >
                            Reject
                          </button>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No payments waiting for review.</p>
              )}
            </section>
          ) : (
            <section className="subscription-card">
              <div>
                <p className="eyebrow">Family subscription</p>
                <h2>₱300 per month</h2>
              </div>
              <p>
                Scan the QR code and send ₱300 through GCash. Then enter the
                receipt reference number for administrator approval.
              </p>
              <img
                className="gcash-qr"
                src="/gcash-qr.png"
                alt="GCash InstaPay QR code for JMM Math monthly subscription"
              />
              <form onSubmit={submitPayment}>
                <input
                  value={gcashReference}
                  onChange={(e) => setGcashReference(e.target.value)}
                  placeholder="GCash reference number"
                  minLength={6}
                  maxLength={40}
                  required
                />
                <Button type="submit">Submit Payment</Button>
              </form>
              {payments[0] && (
                <p className="payment-status">
                  Latest payment: <b>{payments[0].status}</b>
                </p>
              )}
            </section>
          )}
          <h2>Child profile</h2>
          <div className="child-grid">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                className={profile.id === activeProfileId ? 'active' : ''}
                onClick={() => selectProfile(profile)}
              >
                <span>👧🏻</span>
                <b>{profile.name}</b>
                <small>{profile.save_data.player.totalCorrect} correct</small>
                <small>
                  {profile.save_data.player.problemsSolved} attempts
                </small>
              </button>
            ))}
          </div>
          {activeSave && (
            <div className="family-stats">
              {['Addition', 'Subtraction', 'Multiplication', 'Division'].map(
                (subject) => {
                  const stat = subjectSummary(subject);
                  return (
                    <div key={subject}>
                      <b>{subject}</b>
                      <span>{stat.correct} correct</span>
                      <small>
                        {stat.attempts} attempts ·{' '}
                        {Math.max(0, stat.attempts - stat.correct)} mistakes
                      </small>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>
      )}
      {message && (
        <p className="cloud-message" aria-live="polite">
          {message}
        </p>
      )}
      <p className="privacy-note">
        🔒 Each parent can access only their own children’s records.
      </p>
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
