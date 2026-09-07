import { createClient } from '@supabase/supabase-js';
import { DEFAULT_SAVE } from '@/lib/storage';

type CreateClientRequest = {
  parentEmail?: string;
  childName?: string;
  birthDate?: string;
};

const json = (body: unknown, status = 200) => Response.json(body, { status });

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = (
    process.env.ADMIN_EMAIL ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL
  )?.toLowerCase();
  if (!url || !publishableKey || !serviceRoleKey || !adminEmail) {
    return json(
      { error: 'Server administrator settings are incomplete.' },
      503,
    );
  }

  const bearer = request.headers.get('authorization');
  const accessToken = bearer?.startsWith('Bearer ') ? bearer.slice(7) : '';
  if (!accessToken)
    return json({ error: 'Administrator sign-in required.' }, 401);

  const verifier = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } =
    await verifier.auth.getUser(accessToken);
  if (
    authError ||
    !authData.user ||
    authData.user.email?.toLowerCase() !== adminEmail
  ) {
    return json({ error: 'Administrator access required.' }, 403);
  }

  let body: CreateClientRequest;
  try {
    body = (await request.json()) as CreateClientRequest;
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }
  const parentEmail = body.parentEmail?.trim().toLowerCase() ?? '';
  const childName = body.childName?.trim() ?? '';
  const birthDate = body.birthDate ?? '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail))
    return json({ error: 'Enter a valid parent email.' }, 400);
  if (!/^[\p{L}][\p{L}' -]{0,39}$/u.test(childName))
    return json({ error: 'Enter the child’s name.' }, 400);
  const birthday = new Date(`${birthDate}T00:00:00Z`);
  if (!birthDate || Number.isNaN(birthday.valueOf()) || birthday > new Date())
    return json({ error: 'Enter a valid birthday.' }, 400);

  const firstName =
    childName
      .split(/\s+/)[0]
      .normalize('NFKD')
      .replace(/[^a-zA-Z]/g, '') || 'child';
  const password = `${firstName.toLowerCase()}${String(
    birthday.getUTCMonth() + 1,
  ).padStart(2, '0')}${String(birthday.getUTCDate()).padStart(2, '0')}`;
  if (password.length < 8) {
    return json(
      {
        error:
          'The generated password is too short. Use the child’s full name.',
      },
      400,
    );
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: parentEmail,
      password,
      email_confirm: true,
      user_metadata: { child_name: childName },
    });
  if (createError || !created.user) {
    const duplicate = /already|registered|exists/i.test(
      createError?.message ?? '',
    );
    return json(
      {
        error: duplicate
          ? 'That parent email already has an account.'
          : (createError?.message ?? 'Account creation failed.'),
      },
      duplicate ? 409 : 400,
    );
  }

  const saveData = structuredClone(DEFAULT_SAVE);
  saveData.player.name = childName;
  const { error: profileError } = await admin.from('child_profiles').insert({
    parent_id: created.user.id,
    parent_email: parentEmail,
    name: childName,
    save_data: saveData,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: profileError.message }, 400);
  }

  const { error: paymentError } = await admin
    .from('subscription_payments')
    .insert({
      parent_id: created.user.id,
      amount: 300,
      gcash_reference: `ADMIN-${new Date().toISOString().slice(0, 10)}`,
      status: 'approved',
      reviewed_at: new Date().toISOString(),
    });
  if (paymentError) {
    await admin
      .from('child_profiles')
      .delete()
      .eq('parent_id', created.user.id);
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: paymentError.message }, 400);
  }

  return json({ parentEmail, childName, temporaryPassword: password }, 201);
}
