import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SignIn, SignUp } from '@clerk/clerk-react';

// Import all your page components
import Navbar from './pages/navbar/Navbar';
import LandingPage from './pages/landingpage/LandingPage';
import OnboardingPage from './Auth/Onboardingpage';
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
// import Feature from './components/features/Features';


const App = () => {
  return (
    <div className="pt-4">
      <Navbar />
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/onboarding' element={<OnboardingPage />} />
        <Route path='/auth-callback' element={<AuthCallback />} />
        <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" afterSignInUrl="/auth-callback" />} />
        <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" afterSignUpUrl="/onboarding" />} />
        <Route path='/allevents' element={<AllEvents />} />
        <Route path='/category/:categoryId' element={<Category />} />
        {/* <Route path='/features/:featureId' element={<Feature />} /> */}
        <Route path='/events/:eventId' element={<EventDetailPage />} />
        <Route path='/confirmation' element={<Confirmationpage />} />
        <Route path='/my-bookings' element={
          <ProtectedRoute allowedRoles={['attendee']}>
            <MyBookingsPage />
          </ProtectedRoute>
        } />

        <Route path='/organizer-dashboard' element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerDashboard />
          </ProtectedRoute>
        } />
        <Route path='/newEvent' element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <EventForm />
          </ProtectedRoute>
        } />
        <Route path='/create-success' element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <EventPreviewPage />
          </ProtectedRoute>
        } />
        <Route path='/manage-event/:eventId' element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <ManageEventPage />
          </ProtectedRoute>
        } />
        <Route path='/attendee-list/:eventId' element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <AttendeeListPage />
          </ProtectedRoute>
        } />
        <Route path='/scanner/:eventId' element={
          <ProtectedRoute allowedRoles={['organizer']}>
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
