# ADR 0002 — Architecture backend modulaire orientée domaine (Django apps)

## Statut
Accepté

## Contexte
Le backend devra gérer :
- règles métier de réservation (slots, limites, conflits),
- check-in QR + libération automatique à 11h,
- historisation complète,
- administration support,
- statistiques,
- publication de messages vers une queue.

Sans structuration, le projet Django risque de devenir monolithique et illisible.

## Décision
Découper le backend en **apps Django par domaine métier** :
- `users` : utilisateurs, rôles, profils
- `parking` : places, rangées, bornes
- `reservations` : réservation + slots + règles métier
- `checkin` : token/scan QR + confirmation occupation
- `reporting` : KPIs, agrégations
- `integration` : publication vers la queue (events)

## Justification
- Django est conçu pour des apps indépendantes.
- Découpage domain-first = meilleure lisibilité, testabilité, ownership par sous-groupes.
- Permet de limiter les dépendances et de mieux isoler les responsabilités.

## Conséquences
- Nécessite de définir des interfaces claires entre apps (services, signaux, events).
- Les règles métier doivent être centralisées (ex: service `ReservationService`) pour éviter la duplication.
