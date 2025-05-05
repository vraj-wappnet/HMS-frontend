import React from 'react';
import { Outlet } from 'react-router-dom';
import { Activity } from 'lucide-react';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Image/Content */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-secondary/90"></div>
        <div className="relative z-10 max-w-md p-12 text-white">
          <div className="flex items-center mb-8">
            <Activity size={42} />
            <h1 className="text-3xl font-bold ml-3">Healthcare Platform</h1>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <div className="flex items-center justify-center lg:justify-start p-6">
          <div className="lg:hidden flex items-center">
            <Activity size={24} className="text-primary" />
            <span className="text-xl font-semibold ml-2 text-primary">Healthcare Platform</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;