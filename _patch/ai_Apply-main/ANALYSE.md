# Analyse du dépôt

## Vue d'ensemble
Ce dépôt contient une application React monofichier (`App.tsx`) construite avec React Router, Tailwind CSS et les icônes Lucide. L'application simule une plateforme CV/IA baptisée **CVision**, avec pages marketing (Accueil, À propos, Tarifs, Contact) et un tableau de bord de démonstration.

## Architecture principale
- **`App.tsx`** : fichier unique regroupant tous les composants (UI, mises en page, pages) et la configuration du routeur.
  - **Helpers** : fonction `generateGeminiContent` pour appeler l'API Gemini (clé injectée via l'environnement).
  - **Données factices** : constantes `MOCK_CV_MASTER_V1`, `MOCK_HISTORY`, `TESTIMONIALS` pour peupler les interfaces.
  - **Composants UI** : boutons, cartes, badges, modales, uploader de fichiers, barre de progression, table et cartes d'analyses.
  - **Layout** : `Navbar`, `Footer`, `ScrollToTop` avec navigation responsive.
  - **Pages** :
    - `HomePage` : vitrine produit (USP, fonctionnalités, CTA, témoignages, FAQ rapide).
    - `DashboardPage` : simulation d'analyse de CV, score ATS, assistants IA (lettre de motivation, questions d'entretien), historique et templates.
    - `PricingPage` : trois offres (Starter/Pro/Entreprise) avec boutons d'action.
    - `AboutPage` : présentation de la mission et valeurs.
    - `ContactPage` : formulaire simulé avec FAQ.
  - **Routage** : configuration `Router` + `Routes` pointant vers les pages ci-dessus.

## Points notables
- L'application dépend d'une clé API Gemini (`generateGeminiContent`) ; la valeur est laissée vide et supposée injectée par l'environnement.
- Les interactions (upload, analyses, réponses IA) sont simulées côté client par des états React et des temporisations.
- Pas de tests automatisés ni de configuration build fournie dans le dépôt actuel (seulement `App.tsx` et `README.md`).
