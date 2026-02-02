# ADR 0006 — Publication d’événements vers une queue pour l’envoi d’e-mails

## Statut
Accepté

## Contexte
À chaque réservation, un email de confirmation doit être envoyé mais par une autre application.
Notre application doit seulement émettre un message vers une queue.

## Décision
- Utiliser un message broker (RabbitMQ) et publier un event :
  - `ReservationCreated`
- Format du message (JSON) contenant :
  - id réservation
  - user email
  - slots (date + AM/PM + place)
  - timestamp
- Le backend est **publisher uniquement**.

## Justification
- Découplage : notre application ne dépend pas d’un SMTP / service email.
- Robustesse : l’envoi mail peut être retry sans impacter l’API.
- Testabilité : on teste l’émission de l’événement.

## Conséquences
- Nécessite un service broker dans docker-compose.
- Les erreurs broker doivent être gérées (log + retry).