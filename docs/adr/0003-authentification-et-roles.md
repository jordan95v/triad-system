# ADR 0003 — Authentification et gestion des rôles

## Statut
Accepté

## Contexte
L’application est interne mais utilisée par des profils différents :
- Employés : autonomie de réservation
- Secrétaires : administration complète (support / correction)
- Managers : dashboard + règle de réservation spécifique (30 jours)

Il faut sécuriser l’accès aux données, et filtrer les vues selon le rôle.

## Décision
- Authentification API via **JWT** (DRF + `djangorestframework-simplejwt`)
- Gestion des rôles via :
  - soit `Group`/`Permission` Django,
  - soit un champ `role` sur le modèle utilisateur (enum).
- Côté Angular :
  - stockage sécurisé du token,
  - **route guards** basés sur le rôle,
  - masquage/affichage conditionnel des fonctionnalités.

## Justification
- JWT est simple à déployer en conteneurs (pas de session server-side obligatoire).
- Compatible avec un front séparé (Angular).
- Permet de migrer plus tard vers SSO/OIDC sans refaire toute l’app (on remplacera l’émetteur de token).

## Conséquences
- Gestion du refresh token à prévoir (ou durée courte + relog).
- Les endpoints doivent être protégés par permissions DRF cohérentes.
