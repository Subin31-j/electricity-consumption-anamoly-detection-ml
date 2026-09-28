import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminUserDetails from './pages/AdminUserDetails';
import AdminConsumers from './pages/AdminConsumers';
import AdminConsumerDetails from './pages/AdminConsumerDetails';
import AdminDatasets from './pages/AdminDatasets';
import AdminAnalyses from './pages/AdminAnalyses';
import AdminAnalysisDetail from './pages/AdminAnalysisDetail';
import AdminAnomalies from './pages/AdminAnomalies';
import AdminModels from './pages/AdminModels';
import AdminReports from './pages/AdminReports';
import AdminActivity from './pages/AdminActivity';
import AdminSystem from './pages/AdminSystem';
import AdminSettings from './pages/AdminSettings';

/** Nested admin routes rendered under the AdminProtectedRoute in App.jsx. */
export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/:userId" element={<AdminUserDetails />} />
        <Route path="consumers" element={<AdminConsumers />} />
        <Route path="consumers/:consumerId" element={<AdminConsumerDetails />} />
        <Route path="datasets" element={<AdminDatasets />} />
        <Route path="analyses" element={<AdminAnalyses />} />
        <Route path="analyses/:analysisId" element={<AdminAnalysisDetail />} />
        <Route path="anomalies" element={<AdminAnomalies />} />
        <Route path="models" element={<AdminModels />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="activity" element={<AdminActivity />} />
        <Route path="system" element={<AdminSystem />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
