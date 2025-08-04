import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex">
        {/* Sidebar - only show for authenticated users */}
        {isAuthenticated && (
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        )}
        
        {/* Main content */}
        <main className={`flex-1 ${isAuthenticated ? 'lg:ml-64' : ''}`}>
          <div className="pt-16"> {/* Account for fixed header */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;