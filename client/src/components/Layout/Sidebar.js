import React from 'react';

function Sidebar({ sidebarOpen, setSidebarOpen }) {
  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            <p className="text-gray-500 text-sm px-3">Sidebar navigation coming soon...</p>
          </nav>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;