import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Context
import { AuthProvider } from './contexts/AuthContext';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Offers from './pages/Offers/Offers';
import Withdrawals from './pages/Withdrawals/Withdrawals';
import Deposits from './pages/Deposits/Deposits';
import Leaderboard from './pages/Leaderboard/Leaderboard';
import Profile from './pages/Profile/Profile';
import Referrals from './pages/Referrals/Referrals';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminTransactions from './pages/Admin/AdminTransactions';
import AdminOffers from './pages/Admin/AdminOffers';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes with layout */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                
                {/* Authenticated user routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="offers" element={<Offers />} />
                  <Route path="withdrawals" element={<Withdrawals />} />
                  <Route path="deposits" element={<Deposits />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="referrals" element={<Referrals />} />
                </Route>
                
                {/* Admin routes */}
                <Route path="admin" element={<AdminRoute />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="transactions" element={<AdminTransactions />} />
                  <Route path="offers" element={<AdminOffers />} />
                </Route>
              </Route>
              
              {/* Redirect unknown routes */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                className: 'text-sm',
                success: {
                  style: {
                    background: '#10b981',
                    color: 'white',
                  },
                },
                error: {
                  style: {
                    background: '#ef4444',
                    color: 'white',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;