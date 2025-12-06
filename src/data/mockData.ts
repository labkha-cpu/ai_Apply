export const MOCK_CV_MASTER_V1 = {
  meta: {
    generated_at: '2023-10-27T10:30:00Z',
    version: '1.0',
    source: 'parsed_pdf',
  },
  candidate: {
    name: 'Alexandre Dupont',
    email: 'alex.dupont@example.com',
    title: 'Senior Frontend Developer',
    summary: "Développeur passionné avec 5 ans d'expérience en React et TypeScript.",
  },
  skills: [
    { name: 'React', level: 'Expert', category: 'Frontend' },
    { name: 'TypeScript', level: 'Advanced', category: 'Language' },
    { name: 'TailwindCSS', level: 'Advanced', category: 'Styling' },
    { name: 'Node.js', level: 'Intermediate', category: 'Backend' },
  ],
  experience: [
    {
      role: 'Lead Frontend',
      company: 'TechFlow SaaS',
      duration: '2021 - Present',
      achievements: ["Refonte de l'architecture", 'Performance +30%'],
    },
    {
      role: 'Frontend Dev',
      company: 'WebAgency',
      duration: '2018 - 2021',
      achievements: ['Développement de 15 sites vitrines'],
    },
  ],
  education: [{ degree: 'Master Computer Science', school: 'Epitech', year: '2018' }],
};

export const MOCK_HISTORY = [
  { id: 1, name: 'CV_Alexandre_2024.pdf', date: '2023-10-26', score: 85, template: 'Modern SaaS', status: 'Ready' },
  { id: 2, name: 'CV_Alex_V2.pdf', date: '2023-10-25', score: 72, template: 'Harvard', status: 'Draft' },
  { id: 3, name: 'CV_Old.pdf', date: '2023-10-20', score: 45, template: '-', status: 'Error' },
  { id: 4, name: 'Resume_EN.pdf', date: '2023-10-18', score: 91, template: 'LinkedIn', status: 'Ready' },
];

export const TESTIMONIALS = [
  {
    id: 1,
    name: 'Sarah L.',
    role: 'Recruteuse Tech',
    text: "CVision m'a permis de trier les candidatures 2x plus vite. L'analyse JSON est bluffante.",
  },
  { id: 2, name: 'Marc D.', role: 'Candidat', text: "J'ai optimisé mon score ATS de 50 à 90. J'ai décroché un job en 2 semaines." },
  {
    id: 3,
    name: 'Elodie P.',
    role: 'RH Manager',
    text: "L'interface est super intuitive, et les templates générés sont très professionnels.",
  },
];

export const FAQS = [
  { question: 'Mes données sont-elles conservées ?', answer: "Non, nous ne stockons les CV que le temps de la session dans cette démo." },
  { question: 'Le paiement est-il réel ?', answer: "Absolument pas, c'est une interface de démonstration fictive." },
  { question: 'Puis-je utiliser CVision en entreprise ?', answer: 'Oui, CVision est conçu pour les équipes recrutement et les organisations.' },
];
