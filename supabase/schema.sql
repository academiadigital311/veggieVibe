-- Ejecuta este archivo completo en Supabase: Dashboard → SQL Editor → New query → pega y "Run"

-- Tabla de perfiles: guarda si el usuario es Premium y su ID de cliente en Paddle
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  is_premium boolean default false,
  plan text default 'free' check (plan in ('free', 'premium', 'chef')),
  paddle_customer_id text,
  paddle_subscription_id text,
  created_at timestamp with time zone default now()
);

alter table profiles enable row level security;

create policy "El usuario puede ver su propio perfil"
  on profiles for select
  using (auth.uid() = id);

create policy "El usuario puede crear su propio perfil"
  on profiles for insert
  with check (auth.uid() = id);

-- Nota: el UPDATE de is_premium lo hace el webhook con la Service Role Key,
-- que se salta RLS a propósito — así ningún usuario puede marcarse Premium
-- a sí mismo editando el navegador.

-- Tabla de favoritas: relación usuario <-> receta
create table if not exists favoritas (
  user_id uuid references auth.users on delete cascade,
  receta_id integer not null,
  created_at timestamp with time zone default now(),
  primary key (user_id, receta_id)
);

alter table favoritas enable row level security;

create policy "El usuario ve solo sus propias favoritas"
  on favoritas for select
  using (auth.uid() = user_id);

create policy "El usuario agrega solo sus propias favoritas"
  on favoritas for insert
  with check (auth.uid() = user_id);

create policy "El usuario borra solo sus propias favoritas"
  on favoritas for delete
  using (auth.uid() = user_id);

-- Crea automáticamente una fila en "profiles" cuando alguien se registra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, is_premium, plan)
  values (new.id, false, 'free');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Tabla de plan semanal: cada fila es una receta asignada a un día y comida
create table if not exists meal_plans (
  user_id uuid references auth.users on delete cascade,
  day_index smallint not null check (day_index between 0 and 6),
  meal_type text not null check (meal_type in ('desayuno','almuerzo','cena','snack')),
  receta_id integer not null,
  created_at timestamp with time zone default now(),
  primary key (user_id, day_index, meal_type)
);

alter table meal_plans enable row level security;

create policy "El usuario ve solo su propio plan"
  on meal_plans for select
  using (auth.uid() = user_id);

create policy "El usuario agrega a su propio plan"
  on meal_plans for insert
  with check (auth.uid() = user_id);

create policy "El usuario actualiza su propio plan"
  on meal_plans for update
  using (auth.uid() = user_id);

create policy "El usuario borra de su propio plan"
  on meal_plans for delete
  using (auth.uid() = user_id);
