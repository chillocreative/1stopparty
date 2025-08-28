import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import WelcomePage from './components/WelcomePage';
import Dashboard from './pages/Dashboard';
import Registration from './pages/Registration';
import ViewAllUsers from './pages/ViewAllUsers';
import CreateUser from './pages/CreateUser';
import EditUser from './pages/EditUser';
import ViewAllRoles from './pages/ViewAllRoles';
import Profile from './pages/Profile';
import ViewAllMeetings from './pages/ViewAllMeetings';
import CreateMeeting from './pages/CreateMeeting';
import EditMeeting from './pages/EditMeeting';
import ViewAllMeetingCategories from './pages/ViewAllMeetingCategories';
import ViewAllEvents from './pages/ViewAllEvents';
import CreateEvent from './pages/CreateEvent';
import ViewAllEventCategories from './pages/ViewAllEventCategories';

console.log('App.jsx loaded');

// Mount Welcome Page component if element exists
const welcomeElement = document.getElementById('welcome-app');
console.log('Welcome element found:', welcomeElement);

if (welcomeElement) {
    console.log('Mounting WelcomePage component');
    const root = createRoot(welcomeElement);
    root.render(<WelcomePage />);
    console.log('WelcomePage component mounted');
}

// Mount Registration component if element exists
const registrationElement = document.getElementById('registration-app');
if (registrationElement) {
    console.log('Mounting Registration component');
    const root = createRoot(registrationElement);
    root.render(<Registration />);
    console.log('Registration component mounted');
}

// Mount Dashboard component if element exists
const dashboardElement = document.getElementById('dashboard-app');
if (dashboardElement) {
    console.log('Mounting Dashboard component');
    const root = createRoot(dashboardElement);

    // Simple routing based on current path
    const currentPath = window.location.pathname;

    let ComponentToRender = Dashboard;

    if (currentPath === '/users') {
        ComponentToRender = ViewAllUsers;
    } else if (currentPath === '/users/create') {
        ComponentToRender = CreateUser;
    } else if (currentPath.startsWith('/users/edit')) {
        ComponentToRender = EditUser;
    } else if (currentPath === '/roles') {
        ComponentToRender = ViewAllRoles;
    } else if (currentPath === '/meetings') {
        ComponentToRender = ViewAllMeetings;
    } else if (currentPath === '/meetings/create') {
        ComponentToRender = CreateMeeting;
    } else if (currentPath.startsWith('/meetings/edit')) {
        ComponentToRender = EditMeeting;
    } else if (currentPath === '/meeting-categories') {
        ComponentToRender = ViewAllMeetingCategories;
    } else if (currentPath === '/events') {
        ComponentToRender = ViewAllEvents;
    } else if (currentPath === '/events/create') {
        ComponentToRender = CreateEvent;
    } else if (currentPath === '/event-categories') {
        ComponentToRender = ViewAllEventCategories;
    } else if (currentPath === '/profile') {
        ComponentToRender = Profile;
    }

    root.render(<ComponentToRender />);
    console.log('Dashboard component mounted with path:', currentPath, 'Component:', ComponentToRender.name);
}