# ADR 0001 — Stack technique : Angular + Django

## Statut
Accepté

## Contexte
Nous devons remplacer un processus manuel (emails + Excel) par une application simple pour des utilisateurs non techniques.
L’application doit :
- gérer l’authentification et l’affichage selon le profil (Employé / Secrétaire / Manager),
- fournir une UI ergonomique (réservation demi-journée, filtrage, disponibilités),
- inclure un back-office administrable par des secrétaires (édition manuelle, support),
- être déployable en conteneurs, avec tests et scripts.

## Décision
- Frontend : **Angular**
- Backend : **Django + Django REST Framework (DRF)**
- Base de données : **PostgreSQL**
- Admin back-office : **Django Admin** (personnalisé si besoin)

## Justification
- Angular est adapté aux applications “entreprise” : architecture modulaire, routing/guards, formulaires réactifs, maintenabilité.
- Django apporte rapidement une base robuste + un admin natif très utile au profil secrétaire (gain de temps énorme).
- DRF standardise l’API REST avec permissions/serializers.
- PostgreSQL est le choix classique pour la fiabilité, l’historisation et les requêtes analytics (dashboard).

## Conséquences
- Le contrat API doit être cadré (DTO, versioning, erreurs).
- Nécessite une rigueur sur la gestion des rôles/permissions.
- Prépare une intégration SSO future (OIDC) sans l’implémenter tout de suite.
