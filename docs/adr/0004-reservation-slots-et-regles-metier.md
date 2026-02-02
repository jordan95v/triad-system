# ADR 0004 — Modélisation des réservations en slots (AM/PM)

## Statut
Accepté

## Contexte
La réservation se fait en **demi-journées** et doit :
- limiter les employés à 5 jours ouvrés,
- permettre aux managers de réserver jusqu’à 30 jours,
- gérer le besoin de charge (rangées A/F),
- gérer les conflits place/date/slot,
- supporter la libération automatique à 11h (no-show).

Une modélisation “réservation = intervalle de dates” devient vite ambiguë avec AM/PM, check-in, libération à 11h, etc.

## Décision
- Une “réservation” est un objet regroupant plusieurs **slots**.
- Table `Reservation` (auteur, meta, dates demandées, etc.)
- Table `ReservationSlot` :
  - `date`
  - `half_day` (AM/PM)
  - `space_id`
  - `user_id`
  - `status` (RESERVED, CHECKED_IN, CANCELLED, RELEASED, COMPLETED)

Contraintes :
- unicité par `(space_id, date, half_day)` pour éviter double booking.

## Justification
- Conflits et disponibilités deviennent des requêtes simples.
- La libération à 11h impacte uniquement les slots AM.
- Les stats (occupation, no-show) se calculent directement sur les slots.

## Conséquences
- Plus de lignes en base (normal), mais c’est maîtrisé (60 places * slots/jour).
- Doit définir clairement les horaires AM/PM (à figer en sprint 2).
