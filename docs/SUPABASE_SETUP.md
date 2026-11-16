# PRMR Virtual Lab — configuration du compte et de la sauvegarde Supabase

## État initial
- Projet Supabase lié : `bwhlsackoaxwwrgxympl` (Europe).
- Site public : https://aqmar3070.github.io/prmr-virtual-lab/
- Quatre tables créées : `research_projects`, `molecules`, `experiments`, `simulation_runs`.
- Chaque table possède RLS et des politiques `owner_id=auth.uid()` (SELECT/INSERT/UPDATE/DELETE).
- Aucune donnée anonyme n'est autorisée; le navigateur utilise uniquement une clé publishable.
- Client `@supabase/supabase-js@2.119.0` chargé dynamiquement depuis un CDN à version fixée.

## IMPORTANT : deux paramètres Auth à configurer dans Supabase Dashboard
1. Ouvrir [Authentication → URL Configuration](https://supabase.com/dashboard/project/bwhlsackoaxwwrgxympl/auth/url-configuration).
2. Configurer **Site URL** : `https://aqmar3070.github.io/prmr-virtual-lab/`.
3. Ajouter la même URL à la liste **Redirect URLs** (avec slash terminal).
4. Vérifier **Authentication → Sign In / Providers → Email** et conserver la confirmation e-mail activée.
5. Configurer un SMTP personnalisé avant toute ouverture à des utilisateurs extérieurs à l'organisation; l'email d'essai Supabase n'envoie des messages qu'aux adresses préautorisées de membres de l'organisation et impose une limite très faible (2 e-mails/h actuellement).

## Utiliser PRMR
1. Ouvrir https://aqmar3070.github.io/prmr-virtual-lab/.
2. Sélectionner **Espace de recherche privé**.
3. Créer un compte PRMR avec une adresse autorisée et un mot de passe fort (min. 12 caractères dans l'interface). Confirmer l'email si nécessaire; se connecter.
4. Créer un projet PRMR.
5. Dans l'atelier moléculaire, analyser une structure RDKit et revenir à l'espace privé pour cliquer **Enregistrer**.
6. Dans le module PK/PD, configurer une simulation fictive et utiliser **Enregistrer** dans l'espace privé.
7. Recharger la page / se reconnecter pour retrouver l'historique.

## Limites et sécurité
- Les identifiants Supabase Dashboard **ne sont pas automatiquement** des comptes PRMR Auth. La connexion au site utilise Supabase Auth du projet.
- Les clés `sb_secret_*`, la clé `service_role` et le mot de passe PostgreSQL ne doivent jamais être placés dans GitHub Pages.
- La clé publishable du navigateur est explicitement publique; elle doit être associée à des politiques RLS strictes.
- Aucun enregistrement de données patients, de secrets commerciaux ou de fichiers confidentiels avant audit supplémentaire.
- Les molécules sont des structures chimiques de travail; les calculs PK/PD sont des résultats hypothétiques sans validation thérapeutique.
- La connexion réelle à Chrome, le flux d'inscription et la persistance bout-en-bout nécessitent encore un test avec un compte utilisateur humain confirmé.

## Références
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/api/securing-your-api
