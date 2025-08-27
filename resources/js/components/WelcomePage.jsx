import React from 'react';
import LoginForm from './LoginForm';

const WelcomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-xl font-bold">1SP</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to 1 Stop Party System
          </h1>
          <p className="text-gray-600">
            Sign in to access your dashboard
          </p>
        </div>
        
        {/* Login Form */}
        <LoginForm />
        
        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2024 1 Stop Party System. Built with Laravel 12 & React.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;