'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getCloudClient } from '@/lib/cloud';
import type { User } from '@supabase/supabase-js';

type Payment = {
  id: string;
  amount: number;
  gcash_reference: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
};

export function AdminDashboard() {
  const [checked, setChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [message, setMessage] = useState('');
  const isAdmin =
    user?.email?.toLowerCase() ===
    process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase();
  const refresh = async () => {
    const cloud = getCloudClient();
    if (!cloud || !isAdmin) return;
    const { data, error } = await cloud
      .from('subscription_payments')
      .select('*')
      .order('submitted_at', { ascending: false });
    if (error) setMessage(error.message);
    else setPayments((data ?? []) as Payment[]);
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
  if (!checked)
    return (
      <main className="loading">
        <div>✨</div>
        <h1>Opening admin dashboard…</h1>
      </main>
    );
  if (!user)
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="login-mark">🔐</div>
          <p className="eyebrow">Administrator only</p>
          <h1>Magical Mathventure Admin</h1>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const { error } = await getCloudClient()!.auth.signInWithPassword(
                { email, password },
              );
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
  return (
    <main className="admin-page">
      <section className="admin-shell">
        <div className="account-head">
          <div>
            <p className="eyebrow">Administrator dashboard</p>
            <h1>Payment Reviews</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => getCloudClient()?.auth.signOut()}
          >
            Sign Out
          </Button>
        </div>
        <div className="admin-dashboard">
          {payments.length ? (
            <div className="payment-list">
              {payments.map((payment) => (
                <div key={payment.id}>
                  <span>
                    <b>₱{payment.amount}</b>
                    <small>{payment.gcash_reference}</small>
                  </span>
                  <strong>{payment.status}</strong>
                  {payment.status === 'pending' && (
                    <span className="review-actions">
                      <button
                        onClick={() => void review(payment.id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => void review(payment.id, 'rejected')}
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
        </div>
        {message && <p className="cloud-message">{message}</p>}
      </section>
    </main>
  );
}
