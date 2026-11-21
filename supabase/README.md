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

Il éprouve les deux situations qui comptent : une base neuve, et une base où
les tables existent déjà mais incomplètes — le cas réel, puisque l'espace
privé fonctionne depuis des mois. C'est cette seconde situation qui faisait
échouer la première version du script : les index se créaient avant que les
colonnes manquantes aient été ajoutées.

Il échoue si la migration ne passe pas, si le propriétaire ne retrouve pas ses
données, si un autre compte en voit la moindre, ou si un compte parvient à
créer un projet au nom d'un autre. Il ne touche à aucune base distante.

## Clés

`src/cloud.mjs` ne contient qu'une clé *publishable*, publique par conception.
Une clé `service_role` contourne toutes les règles ci-dessus : elle ne doit
jamais figurer dans ce dépôt, ni dans aucun fichier servi au navigateur.

## Extraction de prises depuis un PDF, une image ou un texte

La fonction `exposure-intake` vérifie la session de l’utilisateur et transmet au service d’extraction le document ou le texte explicitement autorisé dans le dossier. La limite par fichier est de 4 Mo. La réponse propose des champs à vérifier. Les fichiers et le texte brut ne sont pas enregistrés dans les tables du laboratoire. Les paramètres confirmés et les résultats sont enregistrés sur demande dans la table existante `simulation_runs`, sous les règles du projet privé.

Déployer la fonction dans le projet Supabase de PRMR avec `supabase functions deploy exposure-intake`. Configurer `OPENAI_API_KEY` dans les secrets de ce projet. La variable facultative `EXPOSURE_AI_MODEL` sélectionne un modèle compatible avec la lecture d’images, de PDF et les sorties structurées de l’API Responses. Le domaine autorisé dans la fonction correspond au site GitHub Pages du laboratoire. Utiliser un exemple dépersonnalisé pour vérifier le service après déploiement.
