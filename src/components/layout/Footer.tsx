import React from 'react';
import { Github, Linkedin, Twitter, Zap } from 'lucide-react';

const Footer: React.FC = () => (
  <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
      <div className="col-span-1 md:col-span-1">
        <div className="flex items-center gap-2 mb-4 text-white">
          <Zap size={20} fill="currentColor" className="text-indigo-400" />
          <span className="text-xl font-bold">CVision</span>
        </div>
        <p className="text-sm text-slate-400">
          La plateforme d'intelligence artificielle pour propulser votre carrière au niveau supérieur.
        </p>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-4">Produit</h4>
        <ul className="space-y-2 text-sm">
          <li>
            <a href="#" className="hover:text-white">
              Fonctionnalités
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-white">
              Intégrations
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-white">
              Tarifs
            </a>
          </li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-4">Ressources</h4>
        <ul className="space-y-2 text-sm">
          <li>
            <a href="#" className="hover:text-white">
              Blog
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-white">
              Guide CV
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-white">
              Documentation API
            </a>
          </li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-4">Légal</h4>
        <ul className="space-y-2 text-sm">
          <li>
            <a href="#" className="hover:text-white">
              Confidentialité
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-white">
              CGU
            </a>
          </li>
        </ul>
        <div className="flex gap-4 mt-4">
          <Linkedin size={20} className="hover:text-white cursor-pointer" />
          <Twitter size={20} className="hover:text-white cursor-pointer" />
          <Github size={20} className="hover:text-white cursor-pointer" />
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
      © 2024 CVision AI. Tous droits réservés. Mock Application.
    </div>
  </footer>
);

export default Footer;
