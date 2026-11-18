-- PRMR Virtual Lab — schéma de l'espace de recherche privé.
--
-- Ce fichier crée les quatre tables que src/cloud.mjs interroge, et les règles
-- de sécurité qui les protègent. Il est écrit pour être exécuté tel quel dans
-- l'éditeur SQL de Supabase, et pour pouvoir l'être plusieurs fois sans
-- dommage : chaque objet est créé seulement s'il n'existe pas, et chaque règle
-- est supprimée avant d'être recréée.
--
-- Principe de sécurité : une personne connectée ne voit et ne modifie que ses
-- propres projets, et tout ce qui est rattaché à ses projets. Il n'existe
-- aucune règle de lecture publique. Les enregistrements des autres comptes
-- sont invisibles, pas seulement masqués par l'interface.
--
-- Un projet appartient à la personne qui l'a créé : owner_id prend la valeur
-- de auth.uid() par défaut, car l'application n'envoie pas ce champ.

create extension if not exists "pgcrypto";

-- 1. Projets de recherche ----------------------------------------------------

create table if not exists public.research_projects (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title         text not null check (length(trim(title)) > 0),
  research_area text not null default 'general',
  status        text not null default 'active',
  created_at    timestamptz not null default now()
);

create index if not exists research_projects_owner_idx
  on public.research_projects (owner_id, created_at desc);

-- 2. Molécules ---------------------------------------------------------------

create table if not exists public.molecules (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.research_projects (id) on delete cascade,
  name             text not null,
  smiles           text,
  source_type      text not null default 'calculated',
  source_reference text,
  descriptors      jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists molecules_project_idx
  on public.molecules (project_id, created_at desc);

-- 3. Simulations -------------------------------------------------------------

create table if not exists public.simulation_runs (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.research_projects (id) on delete cascade,
  model_name    text not null,
  model_version text not null default '1.0',
  status        text not null default 'completed',
  parameters    jsonb not null default '{}'::jsonb,
  results       jsonb not null default '{}'::jsonb,
  uncertainty   jsonb not null default '{}'::jsonb,
  -- La provenance n'est pas décorative : elle dit d'où vient le résultat, et
  -- un enregistrement sans elle ne serait pas traçable.
  provenance    text not null,
  finished_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists simulation_runs_project_idx
  on public.simulation_runs (project_id, created_at desc);

-- 4. Expériences et hypothèses ----------------------------------------------

create table if not exists public.experiments (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.research_projects (id) on delete cascade,
  title         text not null check (length(trim(title)) > 0),
  method        text,
  evidence_type text not null default 'hypothesis',
  status        text not null default 'planned',
  protocol      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists experiments_project_idx
  on public.experiments (project_id, created_at desc);

-- 5. Sécurité au niveau des lignes ------------------------------------------
-- Sans ces règles, la clé publique du site suffirait à lire la base entière.

alter table public.research_projects enable row level security;
alter table public.molecules        enable row level security;
alter table public.simulation_runs  enable row level security;
alter table public.experiments      enable row level security;

drop policy if exists "projets lisibles par leur proprietaire"   on public.research_projects;
drop policy if exists "projets crees par leur proprietaire"      on public.research_projects;
drop policy if exists "projets modifiables par leur proprietaire" on public.research_projects;
drop policy if exists "projets supprimables par leur proprietaire" on public.research_projects;

create policy "projets lisibles par leur proprietaire"
  on public.research_projects for select
  using (owner_id = auth.uid());

create policy "projets crees par leur proprietaire"
  on public.research_projects for insert
  with check (owner_id = auth.uid());

create policy "projets modifiables par leur proprietaire"
  on public.research_projects for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "projets supprimables par leur proprietaire"
  on public.research_projects for delete
  using (owner_id = auth.uid());

-- Les trois tables rattachées suivent le projet : on y accède si et seulement
-- si le projet parent appartient à la personne connectée.

do $$
declare
  t text;
begin
  foreach t in array array['molecules', 'simulation_runs', 'experiments'] loop
    execute format('drop policy if exists %I on public.%I', t || ' lisibles via le projet', t);
    execute format('drop policy if exists %I on public.%I', t || ' crees via le projet', t);
    execute format('drop policy if exists %I on public.%I', t || ' modifiables via le projet', t);
    execute format('drop policy if exists %I on public.%I', t || ' supprimables via le projet', t);

    execute format($f$
      create policy %I on public.%I for select
      using (exists (
        select 1 from public.research_projects p
        where p.id = %I.project_id and p.owner_id = auth.uid()
      ))$f$, t || ' lisibles via le projet', t, t);

    execute format($f$
      create policy %I on public.%I for insert
      with check (exists (
        select 1 from public.research_projects p
        where p.id = project_id and p.owner_id = auth.uid()
      ))$f$, t || ' crees via le projet', t);

    execute format($f$
      create policy %I on public.%I for update
      using (exists (
        select 1 from public.research_projects p
        where p.id = %I.project_id and p.owner_id = auth.uid()
      ))$f$, t || ' modifiables via le projet', t, t);

    execute format($f$
      create policy %I on public.%I for delete
      using (exists (
        select 1 from public.research_projects p
        where p.id = %I.project_id and p.owner_id = auth.uid()
      ))$f$, t || ' supprimables via le projet', t, t);
  end loop;
end $$;

-- 6. Vérification ------------------------------------------------------------
-- Les quatre tables doivent apparaître avec rowsecurity = true.

select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('research_projects', 'molecules', 'simulation_runs', 'experiments')
order by tablename;
