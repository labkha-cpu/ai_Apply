# CVision (front demo)

Démo front-end complète pour la plateforme SaaS CVision : parsing de CV, structuration JSON, scoring ATS et génération de templates PDF. Construite avec React + Vite, TailwindCSS et React Router.

## Scripts

```bash
npm install
npm run dev     # démarre Vite en local
npm run build   # build de production
npm run preview # prévisualisation du build
```

## Pages
- `/` Landing page (pipeline, avantages, témoignages, intégrations)
- `/dashboard` Simulation d'espace connecté (upload, JSON modal, score ATS, templates, assistant IA, historique)
- `/pricing` Plans Starter / Pro / Enterprise
- `/about` Vision produit et architecture cible
- `/contact` Formulaire avec validation basique + FAQ
- `/api-demo` Bonus : requête/réponse JSON mockée

Aucune logique backend n'est incluse : toutes les données sont mockées côté front.
