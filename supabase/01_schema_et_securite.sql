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

-- gen_random_uuid() fait partie du coeur de PostgreSQL depuis la version 13 :
-- aucune extension a installer, et donc aucun droit particulier a demander.

-- 1. Projets de recherche ----------------------------------------------------

create table if not exists public.research_projects (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title         text not null check (length(trim(title)) > 0),
  research_area text not null default 'general',
  status        text not null default 'active',
  created_at    timestamptz not null default now()
);

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

-- 4 bis. Mise à niveau des tables déjà présentes ---------------------------
-- « create table if not exists » ne touche pas une table qui existe déjà :
-- si elle avait été créée autrement, il lui manquerait des colonnes, et la
-- création des règles de sécurité échouerait sur une colonne introuvable.
-- Ces ajouts sont sans effet sur une base neuve, et complètent une base
-- existante sans rien supprimer ni réécrire.

alter table public.research_projects add column if not exists owner_id      uuid default auth.uid();
alter table public.research_projects add column if not exists research_area text not null default 'general';
alter table public.research_projects add column if not exists status        text not null default 'active';
alter table public.research_projects add column if not exists created_at    timestamptz not null default now();

alter table public.molecules add column if not exists smiles           text;
alter table public.molecules add column if not exists source_type      text not null default 'calculated';
alter table public.molecules add column if not exists source_reference text;
alter table public.molecules add column if not exists descriptors      jsonb not null default '{}'::jsonb;
alter table public.molecules add column if not exists created_at       timestamptz not null default now();

alter table public.simulation_runs add column if not exists model_version text not null default '1.0';
alter table public.simulation_runs add column if not exists status        text not null default 'completed';
alter table public.simulation_runs add column if not exists parameters    jsonb not null default '{}'::jsonb;
alter table public.simulation_runs add column if not exists results       jsonb not null default '{}'::jsonb;
alter table public.simulation_runs add column if not exists uncertainty   jsonb not null default '{}'::jsonb;
alter table public.simulation_runs add column if not exists provenance    text;
alter table public.simulation_runs add column if not exists finished_at   timestamptz;
alter table public.simulation_runs add column if not exists created_at    timestamptz not null default now();

alter table public.experiments add column if not exists method        text;
alter table public.experiments add column if not exists evidence_type text not null default 'hypothesis';
alter table public.experiments add column if not exists status        text not null default 'planned';
alter table public.experiments add column if not exists protocol      jsonb not null default '{}'::jsonb;
alter table public.experiments add column if not exists created_at    timestamptz not null default now();

-- Les projets déjà enregistrés sans propriétaire resteraient invisibles à
-- tout le monde une fois les règles actives. Ils sont laissés tels quels :
-- leur attribuer un compte au hasard serait inventer une donnée. La requête
-- finale les signale s'il y en a.

-- 4 ter. Index ------------------------------------------------------------
-- Créés après la mise à niveau des colonnes, et non à la suite de chaque
-- table : sur une base où les tables existaient déjà sans ces colonnes,
-- l'index échouait avant même que la colonne ait été ajoutée.

create index if not exists research_projects_owner_idx
  on public.research_projects (owner_id, created_at desc);
create index if not exists molecules_project_idx
  on public.molecules (project_id, created_at desc);
create index if not exists simulation_runs_project_idx
  on public.simulation_runs (project_id, created_at desc);
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
--
-- Ces règles sont écrites une par une plutôt que générées par une boucle
-- PL/pgSQL. La boucle était plus courte, mais elle imbriquait des chaînes
-- entre dollars dans une autre chaîne entre dollars, ce qu'un éditeur SQL web
-- ne transmet pas toujours intact. Répétitif et lisible vaut mieux qu'habile
-- et fragile.

drop policy if exists "molecules lisibles via le projet"     on public.molecules;
drop policy if exists "molecules crees via le projet"        on public.molecules;
drop policy if exists "molecules modifiables via le projet"  on public.molecules;
drop policy if exists "molecules supprimables via le projet" on public.molecules;

create policy "molecules lisibles via le projet"
  on public.molecules for select
  using (exists (select 1 from public.research_projects p
                 where p.id = molecules.project_id and p.owner_id = auth.uid()));

create policy "molecules crees via le projet"
  on public.molecules for insert
  with check (exists (select 1 from public.research_projects p
                      where p.id = project_id and p.owner_id = auth.uid()));

create policy "molecules modifiables via le projet"
  on public.molecules for update
  using (exists (select 1 from public.research_projects p
                 where p.id = molecules.project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.research_projects p
                      where p.id = molecules.project_id and p.owner_id = auth.uid()));

create policy "molecules supprimables via le projet"
  on public.molecules for delete
  using (exists (select 1 from public.research_projects p
                 where p.id = molecules.project_id and p.owner_id = auth.uid()));

drop policy if exists "simulation_runs lisibles via le projet"     on public.simulation_runs;
drop policy if exists "simulation_runs crees via le projet"        on public.simulation_runs;
drop policy if exists "simulation_runs modifiables via le projet"  on public.simulation_runs;
drop policy if exists "simulation_runs supprimables via le projet" on public.simulation_runs;

create policy "simulation_runs lisibles via le projet"
  on public.simulation_runs for select
  using (exists (select 1 from public.research_projects p
                 where p.id = simulation_runs.project_id and p.owner_id = auth.uid()));

create policy "simulation_runs crees via le projet"
  on public.simulation_runs for insert
  with check (exists (select 1 from public.research_projects p
                      where p.id = project_id and p.owner_id = auth.uid()));

create policy "simulation_runs modifiables via le projet"
  on public.simulation_runs for update
  using (exists (select 1 from public.research_projects p
                 where p.id = simulation_runs.project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.research_projects p
                      where p.id = simulation_runs.project_id and p.owner_id = auth.uid()));

create policy "simulation_runs supprimables via le projet"
  on public.simulation_runs for delete
  using (exists (select 1 from public.research_projects p
                 where p.id = simulation_runs.project_id and p.owner_id = auth.uid()));

drop policy if exists "experiments lisibles via le projet"     on public.experiments;
drop policy if exists "experiments crees via le projet"        on public.experiments;
drop policy if exists "experiments modifiables via le projet"  on public.experiments;
drop policy if exists "experiments supprimables via le projet" on public.experiments;

create policy "experiments lisibles via le projet"
  on public.experiments for select
  using (exists (select 1 from public.research_projects p
                 where p.id = experiments.project_id and p.owner_id = auth.uid()));

create policy "experiments crees via le projet"
  on public.experiments for insert
  with check (exists (select 1 from public.research_projects p
                      where p.id = project_id and p.owner_id = auth.uid()));

create policy "experiments modifiables via le projet"
  on public.experiments for update
  using (exists (select 1 from public.research_projects p
                 where p.id = experiments.project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.research_projects p
                      where p.id = experiments.project_id and p.owner_id = auth.uid()));

create policy "experiments supprimables via le projet"
  on public.experiments for delete
  using (exists (select 1 from public.research_projects p
                 where p.id = experiments.project_id and p.owner_id = auth.uid()));

-- 6. Vérification ------------------------------------------------------------
-- Les quatre tables doivent apparaître avec rowsecurity = true.

select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('research_projects', 'molecules', 'simulation_runs', 'experiments')
order by tablename;

-- Projets sans propriétaire : ils existaient avant les règles de sécurité et
-- ne seront visibles par personne. Zéro est le résultat attendu.
select count(*) as projets_sans_proprietaire
from public.research_projects
where owner_id is null;
