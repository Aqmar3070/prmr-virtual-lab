# Espace de recherche privé — base de données

Le laboratoire enregistre les projets, molécules, simulations et hypothèses
dans un projet Supabase, derrière une authentification par compte. Ce dossier
contient le schéma de cette base et de quoi vérifier qu'elle protège bien ce
qu'elle contient.

## Appliquer le schéma

Ouvrez l'éditeur SQL du projet Supabase du laboratoire, collez le contenu de
`01_schema_et_securite.sql`, exécutez.

Le script crée les quatre tables que `src/cloud.mjs` interroge —
`research_projects`, `molecules`, `simulation_runs`, `experiments` — leurs
index, et seize règles de sécurité au niveau des lignes. Il est réexécutable :
rien n'est dupliqué, aucune donnée existante n'est touchée.

Il se termine par un tableau de vérification. Les quatre tables doivent y
apparaître avec `rowsecurity` à `true`. Si ce n'est pas le cas, la base est
lisible par quiconque possède la clé publique du site, qui est publique par
conception.

## Ce que les règles garantissent

Un projet appartient au compte qui l'a créé. Les molécules, simulations et
hypothèses suivent leur projet. Une personne connectée ne voit et ne modifie
que ce qui lui appartient — les enregistrements des autres comptes sont
invisibles, et non simplement masqués par l'interface.

Aucune règle de lecture publique n'est créée.

## Vérifier plutôt que croire

Ces garanties sont écrites dans des commentaires, et un commentaire ne protège
rien. `verifier_securite.sh` les éprouve : il monte une base PostgreSQL
jetable, y imite le minimum de Supabase (le schéma `auth` et la fonction
`auth.uid()`), applique la migration deux fois de suite, puis fait agir deux
comptes distincts.

```
bash supabase/verifier_securite.sh
```

Il échoue si le propriétaire ne retrouve pas ses données, si un autre compte
en voit la moindre, ou si un compte parvient à créer un projet au nom d'un
autre. Il ne touche à aucune base distante.

## Clés

`src/cloud.mjs` ne contient qu'une clé *publishable*, publique par conception.
Une clé `service_role` contourne toutes les règles ci-dessus : elle ne doit
jamais figurer dans ce dépôt, ni dans aucun fichier servi au navigateur.
