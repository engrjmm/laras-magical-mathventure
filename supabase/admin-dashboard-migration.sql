alter table public.child_profiles
add column if not exists parent_email text;

create unique index if not exists child_profiles_one_per_parent_idx
on public.child_profiles(parent_id);

create policy "Administrator can view all child profiles"
on public.child_profiles for select to authenticated
using ((select lower(auth.jwt() ->> 'email')) = 'joycemalasa062897@gmail.com');

alter table public.subscription_payments
add column if not exists receipt_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-receipts', 'payment-receipts', false, 5000000, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = 5000000,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

create policy "Parents can upload their payment receipts"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'payment-receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Parents and admin can view payment receipts"
on storage.objects for select to authenticated
using (
  bucket_id = 'payment-receipts'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select lower(auth.jwt() ->> 'email')) = 'joycemalasa062897@gmail.com'
  )
);
