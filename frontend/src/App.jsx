import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Import all your page components
import Navbar from './pages/navbar/Navbar';
import LandingPage from './pages/landingpage/LandingPage';
import OnboardingPage from '../src/Auth/Onboardingpage';
import EventDetail from './components/attendee/Eventdetails';
import AllEvents from './components/attendee/AllEvents';
import Confirmationpage from './components/attendee/Confirmation';
import ErrorBoundary from '../src/components/ErrorBoundary'; // ✅ FIXED: Added ErrorBoundary import


// ✅ FIXED: Import the correct MyBookings component
import MyBookingsPage from './components/attendee/MyBooking';

import AuthCallback from './Auth/AuthCallback';
import EventForm from './components/organizer/EventForm';
import NotFoundPage from './helper/Notfound';
import ProtectedRoute from './Auth/ProtectedRoute';
import OrganizerDashboard from './components/organizer/Dashboard';
import ManageEventPage from './components/organizer/ManageEvent';
import AttendeeListPage from './components/organizer/AttendeeList';
import EventScannerPage from './components/organizer/EventScanner';
import EventPreviewPage from './components/organizer/Eventpreview';
import Category from './components/attendee/Category';

// Import new JWT auth components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// ✅ NEW STAFF IMPORTS
import ConditionalFooter from './components/layout/conditionalFooter';
import StaffDashboard from './components/staff/StaffDashboard';
import MyEvents from './components/staff/MyEvents';
import StaffScanner from './components/staff/StaffScanner';
import StaffAttendance from './components/staff/StaffAttendance';

const App = () => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <Navbar />
        <Toaster position="top-center" reverseOrder={false} />
        <main className="pt-20">
          <Routes>
        {/* Public Routes */}
        <Route path='/' element={<LandingPage />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/onboarding' element={<OnboardingPage />} />
        <Route path='/auth-callback' element={<AuthCallback />} />
        <Route path='/allevents' element={<AllEvents />} />
        <Route path='/category/:categoryId' element={<Category />} />
        <Route path='/events/:eventId' element={<EventDetail />} />
        <Route path='/confirmation' element={<Confirmationpage />} />

        {/* ✅ FIXED: Attendee Protected Routes with correct component */}
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
        
        {/* Host Scanner Route */}
        <Route path='/scanner/:eventId' element={
          <ProtectedRoute allowedRoles={['event_host']}>
            <EventScannerPage />
          </ProtectedRoute>
        } />

        {/* ✅ STAFF PROTECTED ROUTES */}
        <Route path='/staff-dashboard' element={
          <ProtectedRoute allowedRoles={['event_staff']}>
            <StaffDashboard />
          </ProtectedRoute>
        } />
        
        {/* ✅ NEW: Staff My Events Route */}
        <Route path='/staff/my-events' element={
          <ProtectedRoute allowedRoles={['event_staff']}>
            <MyEvents />
          </ProtectedRoute>
        } />
        
        {/* ✅ NEW: Staff Scanner Route */}
        <Route path='/staff/scanner/:eventId' element={
          <ProtectedRoute allowedRoles={['event_staff']}>
            <StaffScanner />
          </ProtectedRoute>
        } />
        
        {/* ✅ NEW: Staff Attendance Route */}
        <Route path='/staff/attendance/:eventId' element={
          <ProtectedRoute allowedRoles={['event_staff']}>
            <StaffAttendance />
          </ProtectedRoute>
        } />

        {/* Catch-all 404 */}
        <Route path='*' element={<NotFoundPage />} />
        </Routes>
        <ConditionalFooter />
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;
