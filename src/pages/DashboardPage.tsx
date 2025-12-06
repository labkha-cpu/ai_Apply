import React, { useState } from 'react';
import { 
  ArrowRight, 
  BarChart, 
  CheckCircle, 
  Download, 
  FileText, 
  LayoutDashboard, 
  Zap, 
  AlertCircle, 
  Loader2, 
  X, 
  Upload 
} from 'lucide-react';

// ---------------------------------------------------------------------------
// CONFIGURATION API
// Remplacez cette URL par celle de votre API Gateway (stage Prod ou Dev)
// ---------------------------------------------------------------------------
const API_URL = 'https://qgbog8umw5.execute-api.eu-west-1.amazonaws.com/v1/upload'; 

// ---------------------------------------------------------------------------
// COMPOSANTS UI & MOCK DATA (Inclus pour corriger les erreurs de compilation)
// Dans votre projet réel, conservez ces éléments dans leurs fichiers respectifs.
// ---------------------------------------------------------------------------

// --- MOCK DATA ---
const MOCK_CV_MASTER_V1 = {
  meta: { generated_at: '2023-10-27T10:30:00Z', version: '1.0', source: 'parsed_pdf' },
  candidate: { name: 'Alexandre Dupont', email: 'alex.dupont@example.com', title: 'Senior Frontend Developer', summary: "Développeur passionné..." },
  skills: [{ name: 'React', level: 'Expert' }, { name: 'TypeScript', level: 'Advanced' }],
};

const MOCK_HISTORY = [
  { id: 1, name: 'CV_Alexandre_2024.pdf', date: '2023-10-26', score: 85, template: 'Modern SaaS', status: 'Ready' },
  { id: 2, name: 'CV_Alex_V2.pdf', date: '2023-10-25', score: 72, template: 'Harvard', status: 'Draft' },
  { id: 3, name: 'CV_Old.pdf', date: '2023-10-20', score: 45, template: '-', status: 'Error' },
  { id: 4, name: 'Resume_EN.pdf', date: '2023-10-18', score: 91, template: 'LinkedIn', status: 'Ready' },
];

// --- BADGE ---
type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral' | 'purple';
const Badge: React.FC<{ children: React.ReactNode; variant?: BadgeVariant }> = ({ children, variant = 'neutral' }) => {
  const styles: Record<BadgeVariant, string> = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    neutral: 'bg-gray-100 text-gray-800',
    purple: 'bg-purple-100 text-purple-800 border border-purple-200',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>{children}</span>;
};

// --- BUTTON ---
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: ButtonVariant; size?: 'sm' | 'md' | 'lg'; }
const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm',
    secondary: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 focus:ring-indigo-500',
    outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50',
    ghost: 'bg-transparent text-gray-600 hover:text-indigo-600 hover:bg-indigo-50',
    gradient: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-base', lg: 'px-6 py-3 text-lg' };
  return (
    <button className={`inline-flex items-center justify-center font-medium transition-colors duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- CARD ---
const Card: React.FC<{ children: React.ReactNode; className?: string; hover?: boolean }> = ({ children, className = '', hover = false }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${hover ? 'hover:shadow-soft transition-shadow duration-300' : ''} ${className}`}>
    {children}
  </div>
);

// --- MODAL ---
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// --- FILE UPLOAD ---
const FileUpload: React.FC<{ onUpload: (file: File) => void }> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDrop = (e: React
