import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ShiftCreationPage } from './pages/ShiftCreationPage';
import { EmployeeListPage } from './pages/EmployeeListPage';
import { ShiftRequestAdminPage } from './pages/ShiftRequestAdminPage';
import { ShiftConfirmPage } from './pages/ShiftConfirmPage';
import { ShiftRequestPage } from './pages/ShiftRequestPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* 管理者ルート */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute adminOnly><AdminDashboardPage /></ProtectedRoute>
          } />
          <Route path="/admin/shifts" element={
            <ProtectedRoute adminOnly><ShiftCreationPage /></ProtectedRoute>
          } />
          <Route path="/admin/employees" element={
            <ProtectedRoute adminOnly><EmployeeListPage /></ProtectedRoute>
          } />
          <Route path="/admin/shift-requests" element={
            <ProtectedRoute adminOnly><ShiftRequestAdminPage /></ProtectedRoute>
          } />

          {/* 従業員ルート */}
          <Route path="/shifts" element={
            <ProtectedRoute><ShiftConfirmPage /></ProtectedRoute>
          } />
          <Route path="/shift-requests" element={
            <ProtectedRoute><ShiftRequestPage /></ProtectedRoute>
          } />

          {/* リダイレクト */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
