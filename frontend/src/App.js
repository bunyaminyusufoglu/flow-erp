import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Stores from './pages/Stores';
import Shipments from './pages/Shipments';
import Accounts from './pages/Accounts';
import Settings from './pages/Settings';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/products" element={<Products />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/stores" element={<Stores />} />
      <Route path="/accounts" element={<Accounts />} />
      <Route path="/shipments" element={<Shipments />} />
      <Route path="/settings" element={<Settings />} />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  );
}

export default App;