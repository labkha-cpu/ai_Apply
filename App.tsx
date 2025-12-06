import React, { useState, useEffect } from 'react';
import { 
  HashRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation,
  NavLink
} from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  X, 
  Menu, 
  ChevronRight, 
  Star, 
  Zap, 
  Shield, 
  Cpu, 
  BarChart, 
  Download, 
  Eye, 
  Code,
  ArrowRight,
  Linkedin,
  Twitter,
  Github,
  LayoutDashboard,
  PieChart
} from 'lucide-react';

/**
 * =================================================================================
 * API HELPER (Gemini)
 * =================================================================================
 */

const generateGeminiContent = async (prompt: string) => {
  const apiKey = ""; // L'environnement injectera la clé automatiquement
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Désolé, je n'ai pas pu générer de réponse pour le moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Une erreur technique est survenue lors de la communication avec l'IA.";
  }
};

/**
 * =================================================================================
 * MOCK DATA & TYPES
 * =================================================================================
 */

// Mock User CV Data (Structure JSON demandée)
const MOCK_CV_MASTER_V1 = {
  meta: {
    generated_at: "2023-10-27T10:30:00Z",
    version: "1.0",
    source: "parsed_pdf"
  },
  candidate: {
    name: "Alexandre Dupont",
    email: "alex.dupont@example.com",
    title: "Senior Frontend Developer",
    summary: "Développeur passionné avec 5 ans d'expérience en React et TypeScript."
  },
  skills: [
    { name: "React", level: "Expert", category: "Frontend" },
    { name: "TypeScript", level: "Advanced", category: "Language" },
    { name: "TailwindCSS", level: "Advanced", category: "Styling" },
    { name: "Node.js", level: "Intermediate", category: "Backend" }
  ],
  experience: [
    {
      role: "Lead Frontend",
      company: "TechFlow SaaS",
      duration: "2021 - Present",
      achievements: ["Refonte de l'architecture", "Performance +30%"]
    },
    {
      role: "Frontend Dev",
      company: "WebAgency",
      duration: "2018 - 2021",
      achievements: ["Développement de 15 sites vitrines"]
    }
  ],
  education: [
    { degree: "Master Computer Science", school: "Epitech", year: "2018" }
  ]
};

// Mock History Data
const MOCK_HISTORY = [
  { id: 1, name: "CV_Alexandre_2024.pdf", date: "2023-10-26", score: 85, template: "Modern SaaS", status: "Ready" },
  { id: 2, name: "CV_Alex_V2.pdf", date: "2023-10-25", score: 72, template: "Harvard", status: "Draft" },
  { id: 3, name: "CV_Old.pdf", date: "2023-10-20", score: 45, template: "-", status: "Error" },
  { id: 4, name: "Resume_EN.pdf", date: "2023-10-18", score: 91, template: "LinkedIn", status: "Ready" },
];

// Mock Testimonials
const TESTIMONIALS = [
  { id: 1, name: "Sarah L.", role: "Recruteuse Tech", text: "CVision m'a permis de trier les candidatures 2x plus vite. L'analyse JSON est bluffante." },
  { id: 2, name: "Marc D.", role: "Candidat", text: "J'ai optimisé mon score ATS de 50 à 90. J'ai décroché un job en 2 semaines." },
  { id: 3, name: "Elodie P.", role: "RH Manager", text: "L'interface est super intuitive, et les templates générés sont très professionnels." },
];

/**
 * =================================================================================
 * UI COMPONENTS (src/components/ui)
 * =================================================================================
 */

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
}
const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', size = 'md', className = '', ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm",
    secondary: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 focus:ring-indigo-500",
    outline: "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50",
    ghost: "bg-transparent text-gray-600 hover:text-indigo-600 hover:bg-indigo-50",
    gradient: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- Card ---
const Card: React.FC<{ children: React.ReactNode, className?: string, hover?: boolean }> = ({ children, className = '', hover = false }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${hover ? 'hover:shadow-md transition-shadow duration-300' : ''} ${className}`}>
    {children}
  </div>
);

// --- Badge ---
const Badge: React.FC<{ children: React.ReactNode, variant?: 'success' | 'warning' | 'error' | 'neutral' | 'purple' }> = ({ children, variant = 'neutral' }) => {
  const styles = {
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
    neutral: "bg-gray-100 text-gray-800",
    purple: "bg-purple-100 text-purple-800 border border-purple-200"
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
};

// --- Modal ---
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- FileUpload ---
const FileUpload: React.FC<{ onUpload: (file: File) => void }> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      onUpload(droppedFile);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      onUpload(selectedFile);
    }
  };

  return (
    <div 
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleChange} accept=".pdf,.docx" />
      <div className="flex flex-col items-center gap-3 pointer-events-none">
        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
          <Upload size={24} />
        </div>
        {file ? (
          <div className="flex flex-col items-center">
            <span className="font-medium text-gray-900">{file.name}</span>
            <span className="text-sm text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={14}/> Prêt à analyser</span>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 font-medium">
              Glissez votre CV ici ou <span className="text-indigo-600">parcourez</span>
            </p>
            <p className="text-xs text-gray-400">PDF, DOCX jusqu'à 10MB</p>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * =================================================================================
 * LAYOUT COMPONENTS (src/layouts)
 * =================================================================================
 */

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? "text-indigo-600 font-semibold" : "text-gray-600 hover:text-indigo-600";

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
              <Zap size={18} fill="currentColor" />
            </div>
            <Link to="/" className="text-xl font-bold text-gray-900 tracking-tight">CVision</Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className={isActive('/')}>Accueil</Link>
            <Link to="/about" className={isActive('/about')}>À propos</Link>
            <Link to="/pricing" className={isActive('/pricing')}>Tarifs</Link>
            <Link to="/contact" className={isActive('/contact')}>Contact</Link>
            <Link to="/dashboard">
              <Button size="sm" variant="primary">Espace App</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 shadow-lg absolute w-full px-4 py-4 flex flex-col gap-4">
          <Link to="/" onClick={() => setIsOpen(false)} className="block py-2 text-base font-medium text-gray-700">Accueil</Link>
          <Link to="/about" onClick={() => setIsOpen(false)} className="block py-2 text-base font-medium text-gray-700">À propos</Link>
          <Link to="/pricing" onClick={() => setIsOpen(false)} className="block py-2 text-base font-medium text-gray-700">Tarifs</Link>
          <Link to="/contact" onClick={() => setIsOpen(false)} className="block py-2 text-base font-medium text-gray-700">Contact</Link>
          <Link to="/dashboard" onClick={() => setIsOpen(false)}>
            <Button className="w-full justify-center">Accéder à l'App</Button>
          </Link>
        </div>
      )}
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
      <div className="col-span-1 md:col-span-1">
        <div className="flex items-center gap-2 mb-4 text-white">
          <Zap size={20} fill="currentColor" className="text-indigo-400"/>
          <span className="text-xl font-bold">CVision</span>
        </div>
        <p className="text-sm text-slate-400">
          La plateforme d'intelligence artificielle pour propulser votre carrière au niveau supérieur.
        </p>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-4">Produit</h4>
        <ul className="space-y-2 text-sm">
          <li><a href="#" className="hover:text-white">Fonctionnalités</a></li>
          <li><a href="#" className="hover:text-white">Intégrations</a></li>
          <li><a href="#" className="hover:text-white">Tarifs</a></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-4">Ressources</h4>
        <ul className="space-y-2 text-sm">
          <li><a href="#" className="hover:text-white">Blog</a></li>
          <li><a href="#" className="hover:text-white">Guide CV</a></li>
          <li><a href="#" className="hover:text-white">Documentation API</a></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-4">Légal</h4>
        <ul className="space-y-2 text-sm">
          <li><a href="#" className="hover:text-white">Confidentialité</a></li>
          <li><a href="#" className="hover:text-white">CGU</a></li>
        </ul>
        <div className="flex gap-4 mt-4">
          <Linkedin size={20} className="hover:text-white cursor-pointer"/>
          <Twitter size={20} className="hover:text-white cursor-pointer"/>
          <Github size={20} className="hover:text-white cursor-pointer"/>
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
      © 2024 CVision AI. Tous droits réservés. Mock Application.
    </div>
  </footer>
);

/**
 * =================================================================================
 * PAGE COMPONENTS (src/pages)
 * =================================================================================
 */

// --- Home Page ---
const HomePage = () => {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Badge variant="neutral" ><span className="text-indigo-600 font-semibold px-2">Nouveau</span> v2.0 disponible</Badge>
          <h1 className="mt-6 text-4xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Analyse et optimisation <br/> de <span className="text-indigo-600">CV avec l'IA</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
            Transformez votre CV en aimant à recruteurs. Notre moteur analyse, structure et optimise votre profil pour passer les filtres ATS sans effort.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/dashboard">
              <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-indigo-200">Essayer CVision</Button>
            </Link>
            <Link to="/pricing">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">Voir les tarifs</Button>
            </Link>
          </div>
          
          {/* Mock Dashboard Preview */}
          <div className="mt-16 relative mx-auto max-w-5xl rounded-2xl shadow-2xl border border-gray-200 bg-white p-2 sm:p-4 rotate-1 hover:rotate-0 transition-transform duration-500">
             <div className="aspect-[16/9] bg-slate-50 rounded-xl overflow-hidden border border-gray-100 flex relative text-left">
                {/* Fake Sidebar */}
                <div className="hidden sm:flex w-16 md:w-48 bg-slate-900 flex-col py-4 px-3 gap-4 border-r border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 rounded bg-indigo-500"></div>
                    <div className="h-3 w-20 bg-slate-700 rounded hidden md:block"></div>
                  </div>
                  <div className="space-y-3 opacity-60">
                    <div className="h-2 w-full bg-slate-700 rounded"></div>
                    <div className="h-2 w-3/4 bg-slate-700 rounded"></div>
                    <div className="h-2 w-5/6 bg-slate-700 rounded"></div>
                  </div>
                  <div className="mt-auto space-y-2 opacity-40">
                    <div className="h-8 w-8 rounded-full bg-slate-800"></div>
                  </div>
                </div>
                
                {/* Fake Content Area */}
                <div className="flex-1 flex flex-col p-4 sm:p-6 bg-slate-50/50 overflow-hidden">
                   {/* Fake Header */}
                   <div className="h-10 bg-white rounded-lg shadow-sm border border-gray-100 mb-6 flex items-center justify-between px-4">
                      <div className="h-3 w-32 bg-gray-100 rounded"></div>
                      <div className="flex gap-2">
                        <div className="h-6 w-6 bg-gray-100 rounded-full"></div>
                        <div className="h-6 w-6 bg-indigo-100 rounded-full"></div>
                      </div>
                   </div>
                   
                   {/* Fake Widgets Grid */}
                   <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="h-24 bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between">
                        <div className="h-8 w-8 bg-indigo-50 rounded-lg mb-2"></div>
                        <div className="h-3 w-16 bg-gray-100 rounded"></div>
                      </div>
                      <div className="h-24 bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between">
                        <div className="h-8 w-8 bg-green-50 rounded-lg mb-2"></div>
                        <div className="h-3 w-16 bg-gray-100 rounded"></div>
                      </div>
                      <div className="h-24 bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between hidden sm:flex">
                         <div className="h-8 w-8 bg-purple-50 rounded-lg mb-2"></div>
                         <div className="h-3 w-16 bg-gray-100 rounded"></div>
                      </div>
                   </div>

                   {/* Fake Main Chart Area */}
                   <div className="flex-1 flex gap-4 min-h-0">
                      <div className="flex-[2] bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
                         <div className="flex justify-between mb-4">
                           <div className="h-4 w-24 bg-gray-100 rounded"></div>
                           <div className="h-4 w-8 bg-gray-50 rounded"></div>
                         </div>
                         <div className="flex-1 flex items-end gap-3 px-2 pb-2">
                           <div className="w-full bg-indigo-50 rounded-t-md h-[30%]"></div>
                           <div className="w-full bg-indigo-100 rounded-t-md h-[50%]"></div>
                           <div className="w-full bg-indigo-200 rounded-t-md h-[40%]"></div>
                           <div className="w-full bg-indigo-300 rounded-t-md h-[70%]"></div>
                           <div className="w-full bg-indigo-500 rounded-t-md h-[60%] shadow-lg shadow-indigo-200/50"></div>
                           <div className="w-full bg-indigo-400 rounded-t-md h-[45%]"></div>
                         </div>
                      </div>
                      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4 hidden md:flex flex-col gap-3">
                         <div className="h-4 w-20 bg-gray-100 rounded mb-2"></div>
                         <div className="h-10 w-full bg-gray-50 rounded-lg border border-gray-100"></div>
                         <div className="h-10 w-full bg-gray-50 rounded-lg border border-gray-100"></div>
                         <div className="h-10 w-full bg-gray-50 rounded-lg border border-gray-100"></div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Floating Badge Interaction */}
             <div className="absolute -bottom-6 -right-6 bg-white px-5 py-3 rounded-xl shadow-xl border border-indigo-100 flex items-center gap-3 transform -rotate-2 animate-in slide-in-from-bottom-4 duration-700 delay-300">
               <div className="relative">
                 <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                 <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20"></div>
               </div>
               <div>
                 <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Score ATS</p>
                 <p className="text-lg font-bold text-gray-900 leading-none">92/100</p>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Comment ça marche ?</h2>
            <p className="mt-4 text-gray-600">Optimisez votre carrière en 3 étapes simples.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Upload, title: "1. Uploadez", desc: "Glissez votre PDF actuel. Notre IA scanne le contenu instantanément." },
              { icon: Cpu, title: "2. Analysez", desc: "Détectez les mots-clés manquants et obtenez un score de compatibilité ATS." },
              { icon: FileText, title: "3. Exportez", desc: "Générez un nouveau CV parfaitement formaté en un clic." },
            ].map((step, idx) => (
              <Card key={idx} className="p-8 text-center" hover>
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <step.icon size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Des fonctionnalités pensées pour la réussite</h2>
              <div className="space-y-6">
                {[
                  { title: "Parsing Intelligent", desc: "Extraction précise des compétences et expériences." },
                  { title: "Score ATS en temps réel", desc: "Sachez exactement comment les robots voient votre CV." },
                  { title: "Suggestions IA", desc: "L'IA réécrit vos phrases pour plus d'impact." }
                ].map((feat, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="mt-1 flex-shrink-0">
                      <CheckCircle className="text-green-500" size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{feat.title}</h4>
                      <p className="text-gray-600">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <Card className="p-6 bg-white aspect-square flex flex-col justify-center items-center text-center">
                  <Shield size={40} className="text-indigo-500 mb-3"/>
                  <span className="font-bold">Securisé</span>
               </Card>
               <Card className="p-6 bg-white aspect-square flex flex-col justify-center items-center text-center mt-8">
                  <Zap size={40} className="text-yellow-500 mb-3"/>
                  <span className="font-bold">Rapide</span>
               </Card>
               <Card className="p-6 bg-white aspect-square flex flex-col justify-center items-center text-center -mt-8">
                  <Code size={40} className="text-blue-500 mb-3"/>
                  <span className="font-bold">JSON Export</span>
               </Card>
               <Card className="p-6 bg-white aspect-square flex flex-col justify-center items-center text-center">
                  <Star size={40} className="text-purple-500 mb-3"/>
                  <span className="font-bold">Top Quality</span>
               </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Ils ont décroché le job</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <Card key={t.id} className="p-8 bg-gray-50 border-none">
                <div className="flex gap-1 text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <p className="text-gray-700 italic mb-6">"{t.text}"</p>
                <div>
                  <div className="font-bold text-gray-900">{t.name}</div>
                  <div className="text-sm text-indigo-600">{t.role}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Brands Mock */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
           <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Compatible avec</p>
           <div className="flex justify-center gap-8 md:gap-16 opacity-50 grayscale">
             <span className="font-bold text-xl">LINKEDIN</span>
             <span className="font-bold text-xl">INDEED</span>
             <span className="font-bold text-xl">WORKDAY</span>
             <span className="font-bold text-xl">LEVER</span>
           </div>
        </div>
      </section>
    </div>
  );
};

// --- Dashboard Page ---
const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('linkedin');
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasData, setHasData] = useState(false);

  // AI State
  const [aiMode, setAiMode] = useState<'none' | 'letter' | 'interview'>('none');
  const [jobDesc, setJobDesc] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleUpload = (file: File) => {
    setAnalyzing(true);
    // Simulation d'upload
    setTimeout(() => {
      setAnalyzing(false);
      setHasData(true);
    }, 1500);
  };

  const handleGenerateLetter = async () => {
    if (!jobDesc.trim()) return;
    setAiLoading(true);
    setAiResult('');
    
    const prompt = `
      Tu es un expert en recrutement et coach carrière.
      
      TACHE : Rédige une lettre de motivation professionnelle, concise et percutante en Français.
      
      CANDIDAT :
      Nom : ${MOCK_CV_MASTER_V1.candidate.name}
      Titre : ${MOCK_CV_MASTER_V1.candidate.title}
      Compétences clés : ${MOCK_CV_MASTER_V1.skills.map(s => s.name).join(', ')}
      Expérience : ${MOCK_CV_MASTER_V1.experience[0].role} chez ${MOCK_CV_MASTER_V1.experience[0].company}
      
      POSTE VISÉ (Description du job) :
      "${jobDesc}"
      
      CONSIGNES :
      - Adapte le ton pour être professionnel mais dynamique.
      - Fais le lien entre les compétences du candidat et le poste.
      - Utilise des sauts de ligne pour aérer le texte.
      - Ne mets pas de placeholders [Entreprise], invente ou reste générique si l'info manque.
    `;

    const result = await generateGeminiContent(prompt);
    setAiResult(result);
    setAiLoading(false);
  };

  const handleGenerateQuestions = async () => {
    setAiLoading(true);
    setAiResult('');

    const prompt = `
      Tu es un recruteur technique expert (CTO).
      
      TACHE : Génère 3 questions d'entretien technique difficiles et spécifiques pour ce profil.
      
      PROFIL CANDIDAT :
      Titre : ${MOCK_CV_MASTER_V1.candidate.title}
      Stack technique : ${MOCK_CV_MASTER_V1.skills.map(s => `${s.name} (${s.level})`).join(', ')}
      
      FORMAT DE RÉPONSE ATTENDU (Markdown) :
      ### Question 1 : [La question]
      **Réponse attendue :** [Explication brève des concepts clés à mentionner]
      
      ### Question 2 : ...
      
      ### Question 3 : ...
    `;

    const result = await generateGeminiContent(prompt);
    setAiResult(result);
    setAiLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Crédits restants : </span>
            <Badge variant="success">12 Analyses</Badge>
          </div>
        </div>

        {/* Top Grid: Upload & ATS Score */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Card */}
          <Card className="lg:col-span-2 p-6">
            <h2 className="text-lg font-semibold mb-4">Analyser un nouveau CV</h2>
            {analyzing ? (
              <div className="h-48 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-indigo-600 font-medium">Analyse IA en cours...</p>
              </div>
            ) : hasData ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex flex-col items-center text-center">
                <CheckCircle size={48} className="text-green-500 mb-3" />
                <h3 className="text-lg font-bold text-green-800">Analyse terminée !</h3>
                <p className="text-green-700 mb-4">Nous avons extrait les données de votre PDF.</p>
                <div className="flex gap-3">
                   <Button variant="outline" onClick={() => { setHasData(false); setAiResult(''); setAiMode('none'); }}>Recommencer</Button>
                   <Button onClick={() => setShowJsonModal(true)}>Voir le résultat</Button>
                </div>
              </div>
            ) : (
              <FileUpload onUpload={handleUpload} />
            )}
          </Card>

          {/* Score ATS Card */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Score ATS Estimé</h2>
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40 flex items-center justify-center">
                 {/* Simple SVG Gauge Mock */}
                 <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke={hasData ? "#4F46E5" : "#E5E7EB"} strokeWidth="3" strokeDasharray={`${hasData ? 78 : 0}, 100`} className="transition-all duration-1000 ease-out" />
                 </svg>
                 <div className="absolute flex flex-col items-center">
                   <span className="text-4xl font-bold text-gray-900">{hasData ? 78 : 0}</span>
                   <span className="text-xs text-gray-500">/100</span>
                 </div>
              </div>
              
              <div className="w-full mt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> Mots-clés</span>
                  <span className="font-semibold text-gray-700">Bon</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><X size={14} className="text-red-500"/> Formatage</span>
                  <span className="font-semibold text-gray-700">À revoir</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* AI TOOLS SECTION (New) */}
        {hasData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Outils IA Gemini</h2>
                <Badge variant="purple">Premium</Badge>
             </div>
             
             <div className="grid lg:grid-cols-3 gap-8">
                {/* Tool Selection */}
                <Card className="lg:col-span-1 p-0 overflow-hidden h-fit">
                   <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                      <h3 className="font-bold">Assistants Carrière</h3>
                      <p className="text-xs text-indigo-100 opacity-80">Propulsé par Google Gemini</p>
                   </div>
                   <div className="p-2 space-y-1">
                      <button 
                        onClick={() => { setAiMode('letter'); setAiResult(''); }}
                        className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${aiMode === 'letter' ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50 text-gray-700'}`}
                      >
                         <div className={`p-2 rounded-lg ${aiMode === 'letter' ? 'bg-purple-200' : 'bg-gray-100'}`}>
                            <FileText size={18} />
                         </div>
                         <div>
                            <div className="font-semibold text-sm">Lettre de Motivation</div>
                            <div className="text-xs opacity-70">Génération sur mesure</div>
                         </div>
                      </button>

                      <button 
                        onClick={() => { setAiMode('interview'); setAiResult(''); }}
                        className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${aiMode === 'interview' ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50 text-gray-700'}`}
                      >
                         <div className={`p-2 rounded-lg ${aiMode === 'interview' ? 'bg-purple-200' : 'bg-gray-100'}`}>
                            <MessageSquare size={18} />
                         </div>
                         <div>
                            <div className="font-semibold text-sm">Entretien Technique</div>
                            <div className="text-xs opacity-70">Questions & Réponses</div>
                         </div>
                      </button>
                   </div>
                </Card>

                {/* Tool Content Area */}
                <Card className="lg:col-span-2 p-6 min-h-[300px]">
                   {aiMode === 'none' && (
                      <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-12">
                         <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                            <Sparkles size={32} className="text-purple-400" />
                         </div>
                         <h3 className="text-lg font-medium text-gray-900">Boostez votre candidature</h3>
                         <p className="max-w-sm mt-2">Sélectionnez un outil à gauche pour générer du contenu ultra-personnalisé grâce à l'analyse de votre CV.</p>
                      </div>
                   )}

                   {aiMode === 'letter' && (
                      <div className="space-y-4">
                         <h3 className="font-bold flex items-center gap-2">
                           <FileText size={20} className="text-purple-600"/> 
                           Générateur de Lettre de Motivation ✨
                         </h3>
                         <p className="text-sm text-gray-600">Copiez la description du poste ci-dessous, et Gemini rédigera une lettre adaptée à votre profil.</p>
                         
                         {!aiResult && !aiLoading && (
                           <>
                             <textarea 
                               className="w-full border border-gray-300 rounded-xl p-4 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                               rows={6}
                               placeholder="Collez la description du job ici (ex: Nous recherchons un développeur React Senior...)"
                               value={jobDesc}
                               onChange={(e) => setJobDesc(e.target.value)}
                             />
                             <div className="flex justify-end">
                                <Button variant="gradient" onClick={handleGenerateLetter} disabled={!jobDesc}>
                                  Générer ma lettre ✨
                                </Button>
                             </div>
                           </>
                         )}
                      </div>
                   )}

                   {aiMode === 'interview' && (
                      <div className="space-y-4">
                         <h3 className="font-bold flex items-center gap-2">
                           <MessageSquare size={20} className="text-purple-600"/> 
                           Simulateur d'Entretien ✨
                         </h3>
                         <p className="text-sm text-gray-600">Préparez-vous aux questions pièges basées spécifiquement sur vos compétences ({MOCK_CV_MASTER_V1.skills.slice(0, 3).map(s => s.name).join(', ')}...).</p>
                         
                         {!aiResult && !aiLoading && (
                            <div className="flex justify-start">
                              <Button variant="gradient" onClick={handleGenerateQuestions}>
                                Générer les questions ✨
                              </Button>
                            </div>
                         )}
                      </div>
                   )}

                   {/* AI Loading State */}
                   {aiLoading && (
                      <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
                         <div className="relative">
                            <div className="w-12 h-12 border-4 border-purple-100 rounded-full"></div>
                            <div className="absolute top-0 w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                         </div>
                         <p className="text-purple-700 font-medium animate-pulse">Gemini réfléchit...</p>
                      </div>
                   )}

                   {/* AI Result Display */}
                   {aiResult && !aiLoading && (
                      <div className="mt-4 animate-in fade-in slide-in-from-bottom-2">
                         <div className="bg-purple-50 rounded-xl p-6 border border-purple-100 text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
                            {aiResult}
                         </div>
                         <div className="mt-4 flex gap-3 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => setAiResult('')}>Retour</Button>
                            <Button variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(aiResult)}>Copier le texte</Button>
                         </div>
                      </div>
                   )}
                </Card>
             </div>
          </div>
        )}

        {/* Middle Grid: Data & Templates */}
        <div className="grid lg:grid-cols-2 gap-8">
           {/* Raw Data Preview */}
           <Card className="p-6 flex flex-col h-full">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Données Structurées</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowJsonModal(true)} disabled={!hasData}>
                  <Eye size={16} className="mr-2"/> Voir JSON Complet
                </Button>
             </div>
             <div className="flex-1 bg-slate-900 rounded-lg p-4 font-mono text-xs text-blue-300 overflow-hidden relative">
               {!hasData ? (
                 <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                   En attente d'un CV...
                 </div>
               ) : (
                 <>
                   <div className="mb-2"><span className="text-purple-400">"candidate"</span>: {'{'}</div>
                   <div className="pl-4 mb-1"><span className="text-blue-300">"name"</span>: <span className="text-green-400">"Alexandre Dupont"</span>,</div>
                   <div className="pl-4 mb-1"><span className="text-blue-300">"title"</span>: <span className="text-green-400">"Senior Frontend Developer"</span>,</div>
                   <div className="pl-4 mb-1"><span className="text-blue-300">"skills_count"</span>: <span className="text-yellow-400">4</span></div>
                   <div>{'}'}</div>
                 </>
               )}
             </div>
           </Card>

           {/* Templates */}
           <Card className="p-6">
             <h2 className="text-lg font-semibold mb-4">Générer le PDF</h2>
             
             {/* Custom Tabs */}
             <div className="flex gap-2 border-b border-gray-100 mb-6 overflow-x-auto pb-2">
               {['LinkedIn', 'Consulting', 'Harvard', 'Notion'].map(tab => (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab.toLowerCase())}
                   className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.toLowerCase() ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
                 >
                   {tab}
                 </button>
               ))}
             </div>

             {/* Template Preview Area */}
             <div className="aspect-[210/297] bg-gray-100 rounded border border-gray-200 flex items-center justify-center mb-4 relative group">
                <div className="bg-white shadow-lg w-3/4 h-5/6 p-4 text-[6px] text-gray-400 overflow-hidden select-none">
                  {/* Mock content representing a CV */}
                  <div className="w-1/3 h-2 bg-gray-800 mb-2"></div>
                  <div className="w-full h-[1px] bg-gray-300 mb-2"></div>
                  <div className="space-y-1">
                    <div className="w-full h-1 bg-gray-200"></div>
                    <div className="w-5/6 h-1 bg-gray-200"></div>
                    <div className="w-4/6 h-1 bg-gray-200"></div>
                  </div>
                  <div className="mt-4 w-1/4 h-2 bg-gray-600 mb-1"></div>
                  <div className="space-y-1">
                    <div className="w-full h-1 bg-gray-200"></div>
                    <div className="w-full h-1 bg-gray-200"></div>
                  </div>
                </div>
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button disabled={!hasData} variant="primary" className="shadow-xl">
                    <Download size={16} className="mr-2"/> Télécharger
                  </Button>
                </div>
             </div>
             
             <div className="text-center">
               <p className="text-xs text-gray-500">Le modèle {activeTab} est optimisé pour la lisibilité.</p>
             </div>
           </Card>
        </div>

        {/* History Table */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold">Historique des CVs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Nom du fichier</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Score ATS</th>
                  <th className="px-6 py-3">Template</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_HISTORY.map((row) => (
                  <tr key={row.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                      <FileText size={16} className="text-gray-400"/>
                      {row.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{row.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${row.score}%` }}></div>
                        </div>
                        <span className="text-xs font-medium">{row.score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 capitalize">{row.template}</td>
                    <td className="px-6 py-4">
                      <Badge variant={row.status === 'Ready' ? 'success' : row.status === 'Draft' ? 'warning' : 'error'}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-indigo-600 hover:text-indigo-900 font-medium text-xs">Ouvrir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

      </div>

      {/* JSON Viewer Modal */}
      <Modal 
        isOpen={showJsonModal} 
        onClose={() => setShowJsonModal(false)}
        title="Données extraites (JSON)"
      >
        <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-auto max-h-[60vh]">
          <pre>{JSON.stringify(MOCK_CV_MASTER_V1, null, 2)}</pre>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(MOCK_CV_MASTER_V1, null, 2));
            alert('Copié !');
          }}>
            Copier le JSON
          </Button>
        </div>
      </Modal>
    </div>
  );
};

// --- Pricing Page ---
const PricingPage = () => {
  const plans = [
    {
      name: "Starter",
      price: "19€",
      period: "/mois",
      desc: "Idéal pour une recherche d'emploi ponctuelle.",
      features: ["3 Analyses CV / mois", "Export PDF basique", "Score ATS"],
      cta: "Commencer",
      popular: false
    },
    {
      name: "Pro",
      price: "49€",
      period: "/mois",
      desc: "Pour les chercheurs actifs et l'optimisation continue.",
      features: ["Analyses illimitées", "Tous les templates Premium", "Suggestions IA avancées", "Export JSON"],
      cta: "Choisir Pro",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Devis",
      period: "",
      desc: "Pour les cabinets de recrutement et ESN.",
      features: ["API Access", "Marque blanche", "Support dédié", "Multi-comptes"],
      cta: "Contactez-nous",
      popular: false
    }
  ];

  return (
    <div className="bg-white pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Des tarifs simples et transparents</h1>
        <p className="text-xl text-gray-600 mb-16">Investissez dans votre carrière pour moins que le prix d'un café par jour.</p>
        
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, idx) => (
            <div key={idx} className={`relative rounded-2xl p-8 border ${plan.popular ? 'border-indigo-600 shadow-2xl scale-105 z-10 bg-white' : 'border-gray-200 bg-gray-50'}`}>
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Badge variant="success" >LE PLUS POPULAIRE</Badge>
                </div>
              )}
              <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
              <div className="mt-4 flex items-baseline justify-center">
                <span className="text-4xl font-extrabold tracking-tight text-gray-900">{plan.price}</span>
                <span className="text-base font-medium text-gray-500">{plan.period}</span>
              </div>
              <p className="mt-4 text-sm text-gray-500">{plan.desc}</p>
              <ul className="mt-8 space-y-4 text-left">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-500" />
                    <span className="ml-3 text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button 
                  variant={plan.popular ? 'primary' : 'outline'} 
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- About Page ---
const AboutPage = () => {
  return (
    <div className="bg-white pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Notre Vision</h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          CVision est né d'un constat simple : les meilleurs talents sont souvent invisibles aux yeux des algorithmes de recrutement (ATS). 
          Notre mission est de redonner le pouvoir aux candidats en utilisant la même technologie que les recruteurs, mais à votre avantage.
        </p>
        
        <div className="my-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Comment fonctionne notre moteur ?</h2>
          <div className="border-l-2 border-indigo-200 ml-4 space-y-12">
            {[
              { title: "Step 1 : Parsing", desc: "Nous transformons votre PDF en données brutes structurées." },
              { title: "Step 2 : Structuration", desc: "Organisation des données au format standard JSON Schema Resume." },
              { title: "Step 3 : Scoring & Enrichissement", desc: "Comparaison avec des millions d'offres d'emploi pour détecter les manques." },
              { title: "Step 4 : Génération", desc: "Création d'un document visuel optimisé pour la lecture humaine et machine." }
            ].map((step, idx) => (
              <div key={idx} className="relative pl-8">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-white"></div>
                <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                <p className="text-gray-600 mt-2">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Contact Page ---
const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-gray-50 pt-32 pb-20 min-h-screen">
      <div className="max-w-xl mx-auto px-4">
        <Card className="p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Contactez-nous</h1>
          
          {submitted ? (
            <div className="text-center py-12 animate-in zoom-in">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Message envoyé !</h3>
              <p className="text-gray-600 mt-2">Ceci est une simulation, aucun email n'est parti.</p>
              <Button className="mt-6" variant="outline" onClick={() => setSubmitted(false)}>Envoyer un autre</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input required type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="Jean Dupont" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input required type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="jean@exemple.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vous êtes ?</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
                  <option>Candidat</option>
                  <option>Recruteur</option>
                  <option>RH / Entreprise</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea required rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="Comment pouvons-nous vous aider ?"></textarea>
              </div>
              <Button type="submit" className="w-full">Envoyer le message</Button>
            </form>
          )}
        </Card>

        {/* FAQ Rapide */}
        <div className="mt-12 space-y-6">
           <h3 className="font-bold text-gray-900 text-center">Questions Fréquentes</h3>
           <div className="space-y-4">
             <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
               <h4 className="font-semibold text-sm">Mes données sont-elles conservées ?</h4>
               <p className="text-sm text-gray-600 mt-1">Non, nous ne stockons les CV que le temps de la session dans cette démo.</p>
             </div>
             <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
               <h4 className="font-semibold text-sm">Le paiement est-il réel ?</h4>
               <p className="text-sm text-gray-600 mt-1">Absolument pas, c'est une interface de démonstration fictive.</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

/**
 * =================================================================================
 * MAIN APP COMPONENT & ROUTING
 * =================================================================================
 */

// ScrollToTop component
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-gray-50">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
