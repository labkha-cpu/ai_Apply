import React from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const ApiDemoPage: React.FC = () => {
  const request = {
    step: 'step2_structuration',
    input_format: 'pdf_base64',
    filename: 'cv_alexandre.pdf',
    webhook: 'https://api.client.com/webhooks/cvision',
  };

  const response = {
    status: 'success',
    schema: 'cv_master_v1',
    score_ats: 0.88,
    skills_missing: ['GraphQL', 'Data storytelling'],
    next: 'step4_pdf_generation',
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <Badge variant="purple">API Demo</Badge>
          <h1 className="text-3xl font-bold text-gray-900">Simulation d'appel API</h1>
          <p className="text-gray-600">Envoyez une requête JSON et obtenez une réponse mockée des étapes 2–4.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Requête</h3>
              <Badge variant="neutral">POST /analyze</Badge>
            </div>
            <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto">{JSON.stringify(request, null, 2)}</pre>
            <Button variant="primary" className="mt-4 w-full">Envoyer (mock)</Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Réponse</h3>
              <Badge variant="success">200 OK</Badge>
            </div>
            <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto">{JSON.stringify(response, null, 2)}</pre>
            <p className="text-xs text-gray-500 mt-3">Payload factice pour illustrer l’intégration front.</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ApiDemoPage;
