'use client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { BarChart3, CreditCard, Settings, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCloudClient, type ChildProfile } from '@/lib/cloud';

type Payment = {
  id: string;
  parent_id: string;
  amount: number;
  gcash_reference: string;
  receipt_path: string | null;
  receipt_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
};
type Tab = 'overview' | 'clients' | 'payments' | 'settings';
type AccessDetails = {
  status: 'trial' | 'active' | 'pending' | 'expired';
  label: string;
  activatedAt: Date | null;
  expiresAt: Date | null;
};
const DAY_MS = 24 * 60 * 60 * 1000;
const accessDetailsFor = (
  client: ChildProfile,
  payments: Payment[],
  now: number,
): AccessDetails => {
  const clientPayments = payments.filter(
    (payment) => payment.parent_id === client.parent_id,
  );
  const approved = clientPayments
    .filter((payment) => payment.status === 'approved')
    .sort(
      (a, b) =>
        new Date(b.reviewed_at ?? b.submitted_at).getTime() -
        new Date(a.reviewed_at ?? a.submitted_at).getTime(),
    )[0];
  if (approved) {
    const activatedAt = new Date(approved.reviewed_at ?? approved.submitted_at);
    if (approved.gcash_reference.startsWith('ADMIN-UNTIL-')) {
      const expiresAt = new Date(
        Number(approved.gcash_reference.slice('ADMIN-UNTIL-'.length)),
      );
      return expiresAt.getTime() > now
        ? { status: 'active', label: 'Granted access', activatedAt, expiresAt }
        : { status: 'expired', label: 'Expired', activatedAt, expiresAt };
    }
    if (approved.gcash_reference.startsWith('ADMIN-'))
      return {
        status: 'active',
        label: 'Free access',
        activatedAt,
        expiresAt: null,
      };
    const expiresAt = new Date(activatedAt.getTime() + 30 * DAY_MS);
    return expiresAt.getTime() > now
      ? { status: 'active', label: 'Active', activatedAt, expiresAt }
      : { status: 'expired', label: 'Expired', activatedAt, expiresAt };
  }
  const activatedAt = new Date(client.created_at);
  const expiresAt = new Date(activatedAt.getTime() + 2 * DAY_MS);
  if (expiresAt.getTime() > now)
    return { status: 'trial', label: '2-day trial', activatedAt, expiresAt };
  if (clientPayments.some((payment) => payment.status === 'pending'))
    return {
      status: 'pending',
      label: 'Payment pending',
      activatedAt: null,
      expiresAt: null,
    };
  return { status: 'expired', label: 'Expired', activatedAt, expiresAt };
};

export function AdminDashboard() {
  const [checked, setChecked] = useState(false),
    [user, setUser] = useState<User | null>(null),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [payments, setPayments] = useState<Payment[]>([]),
    [clients, setClients] = useState<ChildProfile[]>([]),
    [tab, setTab] = useState<Tab>('overview'),
    [message, setMessage] = useState(''),
    [currentAdminPassword, setCurrentAdminPassword] = useState(''),
    [newAdminPassword, setNewAdminPassword] = useState(''),
    [confirmAdminPassword, setConfirmAdminPassword] = useState(''),
    [manualEmail, setManualEmail] = useState(''),
    [manualChildName, setManualChildName] = useState(''),
    [manualBirthDate, setManualBirthDate] = useState(''),
    [manualAccessUnit, setManualAccessUnit] = useState<
      'days' | 'months' | 'permanent'
    >('permanent'),
    [manualAccessLength, setManualAccessLength] = useState(1),
    [manualCreating, setManualCreating] = useState(false),
    [createdLogin, setCreatedLogin] = useState<{
      email: string;
      password: string;
    } | null>(null),
    [dashboardNow] = useState(() => Date.now());
  const isAdmin =
    user?.email?.toLowerCase() ===
    process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase();
  const refresh = async () => {
    const cloud = getCloudClient();
    if (!cloud || !isAdmin) return;
    const [paymentResult, clientResult] = await Promise.all([
      cloud
        .from('subscription_payments')
        .select('*')
        .order('submitted_at', { ascending: false }),
      cloud
        .from('child_profiles')
        .select('*')
        .order('updated_at', { ascending: false }),
    ]);
    if (paymentResult.error || clientResult.error)
      return setMessage(
        paymentResult.error?.message ?? clientResult.error?.message ?? '',
      );
    const enriched = await Promise.all(
      ((paymentResult.data ?? []) as Payment[]).map(async (payment) => {
        if (!payment.receipt_path) return payment;
        const { data } = await cloud.storage
          .from('payment-receipts')
          .createSignedUrl(payment.receipt_path, 3600);
        return { ...payment, receipt_url: data?.signedUrl };
      }),
    );
    setPayments(enriched);
    setClients((clientResult.data ?? []) as ChildProfile[]);
  };
  useEffect(() => {
    const cloud = getCloudClient();
    if (!cloud) return setChecked(true);
    cloud.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setChecked(true);
    });
    const { data } = cloud.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setChecked(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    void refresh();
  }, [isAdmin]);
  const review = async (id: string, status: 'approved' | 'rejected') => {
    const cloud = getCloudClient();
    if (!cloud || !isAdmin) return;
    const { error } = await cloud
      .from('subscription_payments')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) setMessage(error.message);
    else await refresh();
  };
  const changeAdminPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    const cloud = getCloudClient();
    if (!cloud || !user?.email || !isAdmin) return;
    if (newAdminPassword !== confirmAdminPassword) {
      setMessage('The new passwords do not match.');
      return;
    }
    if (newAdminPassword.length < 8) {
      setMessage('The new password must contain at least 8 characters.');
      return;
    }
    const login = await cloud.auth.signInWithPassword({
      email: user.email,
      password: currentAdminPassword,
    });
    if (login.error) {
      setMessage('The current password is incorrect.');
      return;
    }
    const { error } = await cloud.auth.updateUser({
      password: newAdminPassword,
    });
    if (error) setMessage(error.message);
    else {
      setCurrentAdminPassword('');
      setNewAdminPassword('');
      setConfirmAdminPassword('');
      setMessage('Administrator password changed successfully ✓');
    }
  };
  const createClientManually = async (event: React.FormEvent) => {
    event.preventDefault();
    const cloud = getCloudClient();
    if (!cloud || !isAdmin) return;
    setManualCreating(true);
    setCreatedLogin(null);
    setMessage('');
    const { data } = await cloud.auth.getSession();
    const response = await fetch('/api/admin/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.session?.access_token ?? ''}`,
      },
      body: JSON.stringify({
        parentEmail: manualEmail,
        childName: manualChildName,
        birthDate: manualBirthDate,
        accessUnit: manualAccessUnit,
        accessLength: manualAccessLength,
      }),
    });
    const result = (await response.json()) as {
      error?: string;
      parentEmail?: string;
      temporaryPassword?: string;
      access?: string;
      profile?: ChildProfile;
      payment?: Payment;
    };
    setManualCreating(false);
    if (!response.ok || !result.parentEmail || !result.temporaryPassword) {
      setMessage(result.error ?? 'Account creation failed.');
      return;
    }
    setCreatedLogin({
      email: result.parentEmail,
      password: result.temporaryPassword,
    });
    setManualEmail('');
    setManualChildName('');
    setManualBirthDate('');
    setMessage(
      manualAccessUnit === 'permanent'
        ? 'Client account created with permanent free access ✓'
        : `Client account created with ${manualAccessLength} ${manualAccessUnit} of free access ✓`,
    );
    await refresh();
    if (result.profile)
      setClients((items) =>
        items.some((client) => client.id === result.profile?.id)
          ? items
          : [result.profile as ChildProfile, ...items],
      );
    if (result.payment)
      setPayments((items) =>
        items.some((payment) => payment.id === result.payment?.id)
          ? items
          : [result.payment as Payment, ...items],
      );
  };
  if (!checked)
    return (
      <main className="loading">
        <div>✨</div>
        <h1>Opening admin dashboard…</h1>
      </main>
    );
  if (!user)
    return (
      <AdminLogin
        email={email}
        password={password}
        message={message}
        setEmail={setEmail}
        setPassword={setPassword}
        setMessage={setMessage}
      />
    );
  if (!isAdmin)
    return (
      <main className="login-page">
        <section className="login-card">
          <h1>Access denied</h1>
          <p>This page is restricted to the administrator.</p>
          <Button onClick={() => getCloudClient()?.auth.signOut()}>
            Sign Out
          </Button>
        </section>
      </main>
    );
  const pending = payments.filter((p) => p.status === 'pending'),
    approved = payments.filter(
      (p) =>
        p.status === 'approved' && !p.gcash_reference.startsWith('ADMIN-'),
    ),
    activeClients = clients.filter(
      (client) =>
        ['active', 'trial'].includes(
          accessDetailsFor(client, payments, dashboardNow).status,
        ),
    );
  const tabs: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'clients', label: 'Clients & Kids', icon: Users },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];
  return (
    <main className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          🧠{' '}
          <span>
            Magical
            <br />
            Mathventure
          </span>
        </div>
        <nav>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={tab === id ? 'active' : ''}
              onClick={() => setTab(id)}
            >
              <Icon /> {label}
            </button>
          ))}
        </nav>
        <button
          className="admin-signout"
          onClick={() => getCloudClient()?.auth.signOut()}
        >
          Sign Out
        </button>
      </aside>
      <section className="admin-content">
        <header>
          <div>
            <p className="eyebrow">Administrator dashboard</p>
            <h1>{tabs.find((item) => item.id === tab)?.label}</h1>
          </div>
          <div className="admin-user">
            <span>JM</span>
            <small>{user.email}</small>
          </div>
        </header>
        {tab === 'overview' && (
          <>
            <div className="admin-kpis">
              <div>
                <span>👨‍👩‍👧</span>
                <small>Registered clients</small>
                <strong>{clients.length}</strong>
              </div>
              <div>
                <span>⏳</span>
                <small>Pending payments</small>
                <strong>{pending.length}</strong>
              </div>
              <div>
                <span>✅</span>
                <small>Active access</small>
                <strong>{activeClients.length}</strong>
              </div>
              <div>
                <span>₱</span>
                <small>Approved revenue</small>
                <strong>₱{approved.length * 300}</strong>
              </div>
            </div>
            <div className="admin-panel">
              <h2>Recent payment activity</h2>
              <PaymentTable payments={payments.slice(0, 5)} review={review} />
            </div>
          </>
        )}
        {tab === 'clients' && (
          <div className="admin-client-layout">
            <form
              className="admin-panel manual-client"
              onSubmit={createClientManually}
            >
              <div className="panel-title">
                <UserPlus />
                <div>
                  <h2>Add a client manually</h2>
                  <p>
                    Create one parent login and one child profile, choose how long
                    free access will last, and unlock 10 surprise treasures.
                  </p>
                </div>
              </div>
              <label>
                Parent email
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(event) => setManualEmail(event.target.value)}
                  required
                />
              </label>
              <label>
                Child’s name
                <input
                  value={manualChildName}
                  onChange={(event) => setManualChildName(event.target.value)}
                  maxLength={40}
                  required
                />
              </label>
              <label>
                Child’s birthday
                <input
                  type="date"
                  value={manualBirthDate}
                  onChange={(event) => setManualBirthDate(event.target.value)}
                  required
                />
              </label>
              <label>
                Free access
                <select
                  value={manualAccessUnit}
                  onChange={(event) =>
                    setManualAccessUnit(
                      event.target.value as 'days' | 'months' | 'permanent',
                    )
                  }
                >
                  <option value="permanent">No expiration</option>
                  <option value="days">Number of days</option>
                  <option value="months">Number of months</option>
                </select>
              </label>
              {manualAccessUnit !== 'permanent' && (
                <label>
                  How many {manualAccessUnit}
                  <input
                    type="number"
                    min={1}
                    max={manualAccessUnit === 'months' ? 120 : 3650}
                    value={manualAccessLength}
                    onChange={(event) =>
                      setManualAccessLength(Number(event.target.value))
                    }
                    required
                  />
                </label>
              )}
              <p className="password-rule">
                The server creates the temporary password from the child’s first
                name + birthday (MMDD). Example: Lara, September 17 → lara0917.
              </p>
              <Button type="submit" disabled={manualCreating}>
                {manualCreating ? 'Creating…' : 'Create Client & Grant Access'}
              </Button>
              {createdLogin && (
                <output className="created-login">
                  <b>Give these login details to the parent:</b>
                  <span>Email: {createdLogin.email}</span>
                  <span>Temporary password: {createdLogin.password}</span>
                  <small>This password is shown only after creation.</small>
                </output>
              )}
            </form>
            <div className="admin-panel">
              <h2>Registered parents and children</h2>
              <div className="client-table">
                <div className="table-header">
                  <b>Parent email</b>
                  <b>Child</b>
                  <b>Access</b>
                  <b>Activated</b>
                  <b>Expires</b>
                  <b>Correct</b>
                  <b>Problems</b>
                  <b>Last active</b>
                </div>
                {clients.map((client) => {
                  const access = accessDetailsFor(
                    client,
                    payments,
                    dashboardNow,
                  );
                  return (
                    <div key={client.id}>
                      <span>{client.parent_email ?? 'Email pending sync'}</span>
                      <b>{client.name}</b>
                      <strong
                        className="access-pill"
                        data-status={access.status}
                      >
                        {access.label}
                      </strong>
                      <span>
                        {access.activatedAt
                          ? access.activatedAt.toLocaleDateString()
                          : 'Not activated'}
                      </span>
                      <span>
                        {access.expiresAt
                          ? access.expiresAt.toLocaleDateString()
                          : access.label === 'Free access'
                            ? 'Never'
                            : 'After approval'}
                      </span>
                      <span>{client.save_data.player.totalCorrect}</span>
                      <span>{client.save_data.player.problemsSolved}</span>
                      <span>
                        {new Date(client.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {tab === 'payments' && (
          <div className="admin-panel">
            <h2>GCash payment submissions</h2>
            <PaymentTable payments={payments} review={review} />
          </div>
        )}
        {tab === 'settings' && (
          <div className="admin-settings-grid">
            <div className="admin-panel">
              <h2>Subscription settings</h2>
              <label>
                Monthly price
                <input value="₱300 for 30 days" readOnly />
              </label>
              <label>
                Payment method
                <input value="GCash QR + manual approval" readOnly />
              </label>
            </div>
            <div className="admin-panel">
              <h2>Application</h2>
              <label>
                Public website
                <input value="magical-mathventure.vercel.app" readOnly />
              </label>
              <label>
                Administrator
                <input value={user.email ?? ''} readOnly />
              </label>
            </div>
            <form
              className="admin-panel password-panel"
              onSubmit={changeAdminPassword}
            >
              <h2>Change admin password</h2>
              <label>
                Current password
                <input
                  type="password"
                  value={currentAdminPassword}
                  onChange={(event) =>
                    setCurrentAdminPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  required
                />
              </label>
              <label>
                New password
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(event) => setNewAdminPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
              <label>
                Confirm new password
                <input
                  type="password"
                  value={confirmAdminPassword}
                  onChange={(event) =>
                    setConfirmAdminPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
              <Button type="submit">Update Password</Button>
            </form>
          </div>
        )}
        {message && <p className="cloud-message">{message}</p>}
      </section>
    </main>
  );
}

function AdminLogin({
  email,
  password,
  message,
  setEmail,
  setPassword,
  setMessage,
}: {
  email: string;
  password: string;
  message: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  setMessage: (v: string) => void;
}) {
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-mark">🔐</div>
        <p className="eyebrow">Administrator only</p>
        <h1>Magical Mathventure Admin</h1>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const { error } = await getCloudClient()!.auth.signInWithPassword({
              email,
              password,
            });
            setMessage(error?.message ?? 'Signed in.');
          }}
        >
          <label>
            Admin email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>
          <button className="magic-button" type="submit">
            Admin Sign In
          </button>
        </form>
        {message && <p className="cloud-message">{message}</p>}
      </section>
    </main>
  );
}

function PaymentTable({
  payments,
  review,
}: {
  payments: Payment[];
  review: (id: string, status: 'approved' | 'rejected') => Promise<void>;
}) {
  if (!payments.length)
    return <div className="admin-empty">No payment submissions yet.</div>;
  return (
    <div className="admin-payment-table">
      <div className="table-header">
        <b>Date</b>
        <b>Reference</b>
        <b>Receipt</b>
        <b>Amount</b>
        <b>Status</b>
        <b>Action</b>
      </div>
      {payments.map((payment) => (
        <div key={payment.id}>
          <span>{new Date(payment.submitted_at).toLocaleDateString()}</span>
          <b>
            {payment.gcash_reference.startsWith('ADMIN-')
              ? 'Admin-granted access'
              : payment.gcash_reference}
          </b>
          <span>
            {payment.receipt_url ? (
              <a href={payment.receipt_url} target="_blank" rel="noreferrer">
                <img src={payment.receipt_url} alt="GCash payment receipt" />
                View
              </a>
            ) : (
              'No screenshot'
            )}
          </span>
          <span>
            {payment.gcash_reference.startsWith('ADMIN-')
              ? 'Free'
              : `₱${payment.amount}`}
          </span>
          <strong data-status={payment.status}>{payment.status}</strong>
          <span className="review-actions">
            {payment.status === 'pending' ? (
              <>
                <button onClick={() => void review(payment.id, 'approved')}>
                  Approve
                </button>
                <button onClick={() => void review(payment.id, 'rejected')}>
                  Reject
                </button>
              </>
            ) : (
              'Reviewed'
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
