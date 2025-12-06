import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Zap } from 'lucide-react';
import Button from '../ui/Button';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isActive = (path: string) =>
    location.pathname === path ? 'text-indigo-600 font-semibold' : 'text-gray-600 hover:text-indigo-600';

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
              <Zap size={18} fill="currentColor" />
            </div>
            <Link to="/" className="text-xl font-bold text-gray-900 tracking-tight">
              CVision
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className={isActive('/')}>
              Accueil
            </Link>
            <Link to="/about" className={isActive('/about')}>
              À propos
            </Link>
            <Link to="/pricing" className={isActive('/pricing')}>
              Tarifs
            </Link>
            <Link to="/contact" className={isActive('/contact')}>
              Contact
            </Link>
            <Link to="/dashboard">
              <Button size="sm" variant="primary">
                Espace App
              </Button>
            </Link>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 shadow-lg absolute w-full px-4 py-4 flex flex-col gap-4">
          <Link to="/" onClick={() => setIsOpen(false)} className="block py-2 text-base font-medium text-gray-700">
            Accueil
          </Link>
          <Link to="/about" onClick={() => setIsOpen(false)} className="block py-2 text-base font-medium text-gray-700">
            À propos
          </Link>
          <Link to="/pricing" onClick={() => setIsOpen(false)} className="block py-2 text-base font-medium text-gray-700">
            Tarifs
          </Link>
          <Link to="/contact" onClick={() => setIsOpen(false)} className="block py-2 text-base font-medium text-gray-700">
            Contact
          </Link>
          <Link to="/dashboard" onClick={() => setIsOpen(false)}>
            <Button className="w-full justify-center">Accéder à l'App</Button>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
