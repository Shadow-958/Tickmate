// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Import all your page components
import Navbar from './pages/navbar/Navbar';
import LandingPage from './pages/landingpage/LandingPage';
import OnboardingPage from '../src/Auth/Onboardingpage';
import EventDetailPage from './components/attendee/Eventdetails';
import AllEvents from './components/attendee/AllEvents';
import Confirmationpage from './components/attendee/Confirmation';
import MyBookingsPage from './components/attendee/Dashboard';
import AuthCallback from './Auth/AuthCallback';
import EventForm from './components/organizer/EventForm';
import NotFoundPage from './helper/Notfound';
import ProtectedRoute from './Auth/ProtectedRoute';
import OrganizerDashboard from './components/organizer/Dashboard';
import ManageEventPage from './components/organizer/ManageEvent';
import AttendeeListPage from './components/organizer/AttendeeList';
import EventScannerPage from './components/organizer/EventScanner';
import EventPreviewPage from './components/organizer/Eventpreview';
import Footer from './pages/footer/Footer';
import Category from './components/attendee/Category';

// Import new JWT auth components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

const App = () => {
  return (
    <div className="pt-4">
      <Navbar />
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        {/* Public Routes */}
        <Route path='/' element={<LandingPage />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/onboarding' element={<OnboardingPage />} />
        <Route path='/auth-callback' element={<AuthCallback />} />
        <Route path='/allevents' element={<AllEvents />} />
        <Route path='/category/:categoryId' element={<Category />} />
        <Route path='/events/:eventId' element={<EventDetailPage />} />
        <Route path='/confirmation' element={<Confirmationpage />} />

        {/* Attendee Protected Routes */}
        <Route path='/my-bookings' element={
          <ProtectedRoute allowedRoles={['event_attendee']}>
            <MyBookingsPage />
          </ProtectedRoute>
        } />

        {/* Host Protected Routes */}
        <Route path='/organizer-dashboard' element={
          <ProtectedRoute allowedRoles={['event_host']}>
            <OrganizerDashboard />
          </ProtectedRoute>
        } />
        <Route path='/newEvent' element={
          <ProtectedRoute allowedRoles={['event_host']}>
            <EventForm />
          </ProtectedRoute>
        } />
        <Route path='/create-success' element={
          <ProtectedRoute allowedRoles={['event_host']}>
            <EventPreviewPage />
          </ProtectedRoute>
        } />
        <Route path='/manage-event/:eventId' element={
          <ProtectedRoute allowedRoles={['event_host']}>
            <ManageEventPage />
          </ProtectedRoute>
        } />
        <Route path='/attendee-list/:eventId' element={
          <ProtectedRoute allowedRoles={['event_host']}>
            <AttendeeListPage />
          </ProtectedRoute>
        } />
        <Route path='/scanner/:eventId' element={
          <ProtectedRoute allowedRoles={['event_host', 'event_staff']}>
            <EventScannerPage />
          </ProtectedRoute>
        } />

        {/* --- Catch-all 404 Route --- */}
        <Route path='*' element={<NotFoundPage />} />
      </Routes>
      <Footer/>
    </div>
  );
};

export default App;