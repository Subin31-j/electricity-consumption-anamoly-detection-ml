import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import PublicLayout from './components/layout/PublicLayout';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminProtectedRoute from './routes/AdminProtectedRoute';

import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import DocumentationPage from './pages/DocumentationPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';
import DashboardPage from './pages/DashboardPage';
import MyConsumptionPage from './pages/MyConsumptionPage';
import UploadDatasetPage from './pages/UploadDatasetPage';
import DatasetsPage from './pages/DatasetsPage';
import ResultsPage from './pages/ResultsPage';
import VisualizationsPage from './pages/VisualizationsPage';
import ModelComparisonPage from './pages/ModelComparisonPage';
import HistoryPage from './pages/HistoryPage';
import ReportsPage from './pages/ReportsPage';

import LoginPage from './auth/pages/LoginPage';
import RegisterPage from './auth/pages/RegisterPage';
import ForgotPasswordPage from './auth/pages/ForgotPasswordPage';

import { Loading } from './components/ui/States';

// Admin console is code-split: normal users never download it.
const AdminRoutes = lazy(() => import('./admin/AdminRoutes'));

/**
 * Root route tree. Public pages, auth pages, the authenticated user area, and
 * the admin panel (guarded by AdminProtectedRoute on the frontend and by
 * require_admin on every /api/admin/* endpoint on the backend).
 */
export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/documentation" element={<DocumentationPage />} />
      </Route>

      {/* Auth (no layout) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Authenticated user area */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/consumption" element={<MyConsumptionPage />} />
        <Route path="/datasets" element={<DatasetsPage />} />
        <Route path="/upload" element={<UploadDatasetPage />} />
        <Route path="/preview" element={<UploadDatasetPage />} />
        <Route path="/analysis/:analysisId/results" element={<ResultsPage />} />
        <Route path="/analysis/:analysisId/visualizations" element={<VisualizationsPage />} />
        <Route path="/analysis/:analysisId/comparison" element={<ModelComparisonPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Route>

      {/* Admin area - full panel under backend-enforced + frontend ADMIN guard */}
      <Route
        path="/admin/*"
        element={
          <AdminProtectedRoute>
            <Suspense
              fallback={
                <div style={{ padding: 24, background: '#060e1f', minHeight: '100vh' }}>
                  <Loading label="Loading admin console..." variant="inline" />
                </div>
              }
            >
              <AdminRoutes />
            </Suspense>
          </AdminProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
