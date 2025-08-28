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
import ViewAllMembers from './pages/ViewAllMembers';
import MembersDashboard from './pages/MembersDashboard';
import MembersAnalysis from './pages/MembersAnalysis';
import MembersUpload from './pages/MembersUpload';
import PendingApproval from './pages/PendingApproval';
import APISettings from './pages/APISettings';
import ViewFinances from './pages/ViewFinances';
import UploadFinanceFiles from './pages/UploadFinanceFiles';

console.log('App.jsx loaded');

// Mount Test component if element exists
const testElement = document.getElementById('test-app');
if (testElement) {
    console.log('Mounting Test component');
    const root = createRoot(testElement);
    root.render(React.createElement('div', { 
        style: { padding: '20px', backgroundColor: '#f0f0f0', border: '2px solid #00ff00' }
    }, 'React is working! Card test: ', React.createElement('div', {
        className: 'rounded-lg border bg-card text-card-foreground shadow-sm p-4 mt-2'
    }, 'This is a test card component')));
    console.log('Test component mounted');
}

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

    if (currentPath === '/dashboard') {
        ComponentToRender = Dashboard;
    } else if (currentPath === '/users') {
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
    } else if (currentPath === '/members') {
        ComponentToRender = ViewAllMembers;
    } else if (currentPath === '/members/dashboard') {
        ComponentToRender = MembersDashboard;
    } else if (currentPath === '/members/analysis') {
        ComponentToRender = MembersAnalysis;
    } else if (currentPath === '/members/upload') {
        ComponentToRender = MembersUpload;
    } else if (currentPath === '/members/pending-approval') {
        ComponentToRender = PendingApproval;
    } else if (currentPath === '/members/api-settings') {
        ComponentToRender = APISettings;
    } else if (currentPath === '/finances') {
        ComponentToRender = ViewFinances;
    } else if (currentPath === '/finances/upload') {
        ComponentToRender = UploadFinanceFiles;
    } else if (currentPath === '/profile') {
        ComponentToRender = Profile;
    }

    root.render(<ComponentToRender />);
    console.log('Dashboard component mounted with path:', currentPath, 'Component:', ComponentToRender.name);
}