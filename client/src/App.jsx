import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Shell from './components/layout/Shell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import GroceriesPage from './pages/groceries/GroceriesPage.jsx';
import BillsPage from './pages/bills/BillsPage.jsx';
import ChoresPage from './pages/chores/ChoresPage.jsx';
import InventoryPage from './pages/inventory/InventoryPage.jsx';
import MealsPage from './pages/meals/MealsPage.jsx';
import AccountPage from './pages/auth/AccountPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/*" element={
        <ProtectedRoute>
          <Shell>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/groceries" element={<GroceriesPage />} />
              <Route path="/bills" element={<BillsPage />} />
              <Route path="/chores" element={<ChoresPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/meals" element={<MealsPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Shell>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
