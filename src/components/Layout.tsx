import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition duration-300 ease-in-out lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        bg-white shadow-xl lg:shadow-none
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 mr-2 rounded-lg text-gray-500 lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors"
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
        </Header>

        <main className="flex-1 overflow-y-auto bg-gray-50 focus:outline-none">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-h-full flex flex-col">
            <div className="flex-1">
              <Outlet />
            </div>

            {/* Footer integrated into scrollable area */}
            <footer className="mt-12 border-t border-gray-200 pt-6 pb-8">
              <div className="text-center text-sm text-gray-500">
                <p>
                  Powered by{' '}
                  <a
                    href="https://www.botivate.in/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary hover:text-primary transition-colors"
                  >
                    Botivate
                  </a>
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  &copy; {new Date().getFullYear()} Maintenance Pro. All rights reserved.
                </p>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;