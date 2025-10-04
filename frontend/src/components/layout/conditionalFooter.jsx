
// src/components/layout/ConditionalFooter.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import Footer from '../../pages/footer/Footer';

const ConditionalFooter = () => {
  const location = useLocation();

  // Pages where footer should NOT appear
  const hideFooterPaths = [
    '/allevents',
    '/login',
    '/register',
    '/organizer-dashboard',
    '/staff-dashboard', 
    '/my-bookings',
    '/scanner',
    '/manage-event',
    '/attendee-list',
    '/newEvent',
    '/create-success'
  ];

  // Check if current path should hide footer
  const shouldHideFooter = hideFooterPaths.some(path => 
    location.pathname.startsWith(path)
  );

  // Also hide footer if user is on any admin/dashboard type page
  const isAdminPage = location.pathname.includes('dashboard') ||
                     location.pathname.includes('manage') ||
                     location.pathname.includes('scanner') ||
                     location.pathname.includes('admin');

  if (shouldHideFooter || isAdminPage) {
    return null;
  }

  return <Footer />;
};

export default ConditionalFooter;
