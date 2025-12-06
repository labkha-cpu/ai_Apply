import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { FAQS } from '../data/mockData';
import { CheckCircle } from 'lucide-react';

const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-gray-50 pt-24 pb-20 min-h-screen">
      <div className="max-w-xl mx-auto px-4">
        <Card className="p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Contactez-nous</h1>

          {submitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Message envoyé !</h3>
              <p className="text-gray-600 mt-2">Ceci est une simulation, aucun email n'est parti.</p>
              <Button className="mt-6" variant="outline" onClick={() => setSubmitted(false)}>
                Envoyer un autre
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  required
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="jean@exemple.com"
                />
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
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Comment pouvons-nous vous aider ?"
                ></textarea>
              </div>
              <Button type="submit" className="w-full">
                Envoyer le message
              </Button>
            </form>
          )}
        </Card>

        <div className="mt-12 space-y-6">
          <h3 className="font-bold text-gray-900 text-center">Questions Fréquentes</h3>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.question} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h4 className="font-semibold text-sm">{faq.question}</h4>
                <p className="text-sm text-gray-600 mt-1">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
