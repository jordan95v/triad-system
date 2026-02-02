# ADR 0005 — Check-in via QR Code + libération automatique à 11:00

## Statut
Accepté

## Contexte
Règle métier : si une place réservée n’a pas de check-in avant 11:00, elle redevient disponible le jour même.
Chaque place aura un QR code imprimé pointant vers un endpoint dédié.

Problème : un QR public ne doit pas permettre de consulter des données sensibles ou de check-in frauduleux.

## Décision
- QR code pointant vers un endpoint de check-in :
  - `POST /api/checkin/{spaceId}?token=...`
- Le token est un **jeton signé** ou un token rotatif stocké côté serveur.
- Le check-in valide :
  - utilisateur authentifié (au moins via login web, puis action check-in),
  - correspondance avec un slot actif (date du jour + AM en cours),
  - cohérence place réservée / utilisateur.

Libération automatique :
- Job planifié à 11:00 :
  - tous les slots AM `RESERVED` sans `CHECKED_IN` => `RELEASED`.

## Justification
- Le token dans le QR empêche de transformer une URL de check-in en commande publique.
- La libération automatique rend le système plus équitable et optimise l’occupation.

## Conséquences
- Nécessite un mécanisme de scheduler.
