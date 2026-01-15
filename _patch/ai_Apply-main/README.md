# CVision (front demo)

Démo front-end complète pour la plateforme SaaS CVision : parsing de CV, structuration JSON, scoring ATS et génération de templates PDF. Construite avec React + Vite, TailwindCSS et React Router.

## Configuration

Copier `.env.example` en `.env` puis renseigner :

- `VITE_MANAGE_CV_API_BASE_URL` : API "Manage CV" (upload presigned + candidate_id)
- `VITE_PROFILES_API_BASE_URL` : API "Profiles" (BFF) pour le polling / profils / artefacts

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

Le Dashboard consomme les APIs AWS (upload + polling + artefacts). Les autres pages restent majoritairement démo/mock.

### Endpoints utilisés dans le dashboard

- Upload (Manage): `POST {MANAGE}/upload` → retourne `upload_url`, `candidate_id`, `key`
- Polling (Profiles): `GET {PROFILES}/candidates/{candidate_id}/profile?include=preview|all`
- Artefacts (Profiles): `GET {PROFILES}/candidates/{candidate_id}/artifacts/{type}` (ex: `step1_json`, `step2_cv_master`, `toon`, `step4_pdf`)
