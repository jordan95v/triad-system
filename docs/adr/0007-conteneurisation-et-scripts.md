# ADR 0007 — Conteneurisation + scripts standard (build/run/test/lint)

## Statut
Accepté

## Contexte
Exigences du projet :
- l’app doit tourner en conteneurs,
- toutes les actions répétables doivent être scriptées,
- faciliter contribution et déploiement,
- tests réels exécutables facilement.

## Décision
- En dev : `docker-compose` avec services :
  - `frontend` (Angular servi en container)
  - `backend` (Django)
  - `db` (PostgreSQL)
  - `mq` (RabbitMQ)
- Scripts à la racine :
  - `scripts/build.sh`
  - `scripts/run.sh`
  - `scripts/test.sh`
  - `scripts/lint.sh`

## Justification
- Évite les divergences (ça marche sur ma machine).
- Rend la CI future presque triviale.
- Simplifie l’onboarding d’un nouveau membre.

## Conséquences
- Il faudra maintenir les Dockerfiles.
- Les scripts deviennent la seule interface officielle pour lancer le projet.
