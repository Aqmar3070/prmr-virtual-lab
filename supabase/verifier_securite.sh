#!/usr/bin/env bash
# PRMR — vérifie que les règles de sécurité font ce qu'elles promettent.
#
# Le fichier 01_schema_et_securite.sql affirme qu'une personne connectée ne
# voit que ses propres projets. Une affirmation dans un commentaire ne protège
# rien : ce script l'éprouve. Il monte une base PostgreSQL jetable, y imite le
# minimum de Supabase (le schéma auth et la fonction auth.uid()), applique la
# migration, puis fait agir deux comptes distincts.
#
# Il ne touche à aucune base distante. Usage : bash supabase/verifier_securite.sh
set -euo pipefail

BIN=$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | tail -1)
[ -n "$BIN" ] || { echo "PostgreSQL introuvable sur cette machine."; exit 2; }

RACINE=$(cd "$(dirname "$0")/.." && pwd)
# initdb refuse de travailler dans un répertoire qui ne lui appartient pas :
# on le crée directement au nom du compte postgres.
DONNEES=/tmp/prmr-pg-$$
PORT=${PRMR_PG_PORT:-5440}
mkdir -p "$DONNEES"
chown postgres:postgres "$DONNEES"
nettoyer() { su postgres -c "$BIN/pg_ctl -D $DONNEES stop -m immediate" >/dev/null 2>&1 || true; rm -rf "$DONNEES"; }
trap nettoyer EXIT

su postgres -c "$BIN/initdb -D $DONNEES -U postgres" >/dev/null 2>&1
su postgres -c "$BIN/pg_ctl -D $DONNEES -o '-p $PORT -k /tmp' -l $DONNEES/log start" >/dev/null
su postgres -c "psql -h /tmp -p $PORT -U postgres -qc 'create database prmr'"
su postgres -c "psql -h /tmp -p $PORT -U postgres -qc 'create database prmr_neuve'"

# -q et client_min_messages taisent les « NOTICE ... skipping » attendus d'un
# script réexécutable ; dernier() ne garde que la dernière ligne, car psql
# imprime aussi les étiquettes SET et INSERT des instructions qui précèdent.
BASE=prmr
psql_() { su postgres -c "PGOPTIONS='-c client_min_messages=warning' psql -h /tmp -p $PORT -U postgres -d $BASE -v ON_ERROR_STOP=1 -q -tA $*"; }
dernier() { tail -n 1; }

psql_ "-c \"create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as \\\$\\\$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid \\\$\\\$;\"" >/dev/null
BASE=prmr_neuve
psql_ "-c \"create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as \\\$\\\$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid \\\$\\\$;\"" >/dev/null
# D'abord une base neuve : le script doit pouvoir partir de rien.
psql_ "-f $RACINE/supabase/01_schema_et_securite.sql" >/dev/null
echo "Base neuve : migration appliquée."
BASE=prmr

# Cas réel : les tables existent déjà, créées autrement et incomplètes.
# « create table if not exists » les laisse telles quelles, et sans les ajouts
# de colonnes la création des règles échouerait sur une colonne introuvable.
psql_ "-c \"create table public.research_projects (id uuid primary key default gen_random_uuid(), title text not null);
create table public.molecules (id uuid primary key default gen_random_uuid(), project_id uuid references public.research_projects(id) on delete cascade, name text not null);\"" >/dev/null
echo "Tables préexistantes et incomplètes simulées."

psql_ "-f $RACINE/supabase/01_schema_et_securite.sql" >/dev/null
echo "Migration appliquée."
psql_ "-f $RACINE/supabase/01_schema_et_securite.sql" >/dev/null
echo "Réexécutée sans dommage."

psql_ "-c \"create role authenticated nologin;
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
insert into auth.users (id) values
 ('11111111-1111-1111-1111-111111111111'),
 ('22222222-2222-2222-2222-222222222222');\"" >/dev/null

A=$(psql_ "-c \"set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into public.research_projects (title) values ('Recherche rénale');
insert into public.molecules (project_id, name)
  select id, 'Caféine' from public.research_projects limit 1;
select count(*) from public.molecules;\"" | dernier)
[ "$A" = "1" ] || { echo "ÉCHEC : le propriétaire ne voit pas sa propre molécule ($A)."; exit 1; }

B=$(psql_ "-c \"set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select (select count(*) from public.research_projects)
     + (select count(*) from public.molecules)
     + (select count(*) from public.simulation_runs)
     + (select count(*) from public.experiments);\"" | dernier)
[ "$B" = "0" ] || { echo "ÉCHEC : un autre compte voit $B enregistrements qui ne sont pas les siens."; exit 1; }

VOL=$(psql_ "-c \"set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
do \\\$\\\$ begin
  insert into public.research_projects (owner_id, title)
  values ('11111111-1111-1111-1111-111111111111', 'projet volé');
  raise exception 'ECHEC';
exception when insufficient_privilege then null; end \\\$\\\$;
select 'refuse';\"" | dernier)
[ "$VOL" = "refuse" ] || { echo "ÉCHEC : un compte a pu créer un projet au nom d'un autre."; exit 1; }

echo "Le propriétaire voit ses données ; un autre compte n'en voit aucune et ne peut pas s'en attribuer."
