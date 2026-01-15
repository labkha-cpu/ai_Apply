import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ApiDemoPage from './pages/ApiDemoPage';
import PaymentStatusPage from './pages/PaymentStatusPage';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => (
  <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-gray-50">
    <Navbar />
    <main className="flex-grow">
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          )}
        />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/api-demo" element={<ApiDemoPage />} />
        <Route path="/payment/success" element={<PaymentStatusPage status="success" />} />
        <Route path="/payment/cancel" element={<PaymentStatusPage status="cancel" />} />
      </Routes>
    </main>
    <Footer />
  </div>
);

export default App;
