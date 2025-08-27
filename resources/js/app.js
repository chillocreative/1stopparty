import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import WelcomePage from './components/WelcomePage';
import Dashboard from './pages/Dashboard';

// Mount Welcome Page component if element exists
const welcomeElement = document.getElementById('welcome-app');
if (welcomeElement) {
    const root = createRoot(welcomeElement);
    root.render(<WelcomePage />);
}

// Mount Dashboard component if element exists
const dashboardElement = document.getElementById('dashboard-app');
if (dashboardElement) {
    const root = createRoot(dashboardElement);
    root.render(<Dashboard />);
}
