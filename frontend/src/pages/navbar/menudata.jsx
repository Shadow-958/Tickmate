// src/components/navbar/menudata.jsx
import React from 'react';

// Icon components
export const TechIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

export const WorkshopIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

export const ComedyIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const FitnessIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

export const MusicIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
  </svg>
);

export const NetworkingIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

// Menu data
export const categoryMenu = {
  title: "Event Categories",
  items: [
    { 
      id: "tech-meetups", 
      path: "/category/tech-meetups", 
      icon: <TechIcon />, 
      title: "Tech Meetups", 
      description: "Connect with developers, designers, and tech enthusiasts" 
    },
    { 
      id: "workshops-training", 
      path: "/category/workshops-training", 
      icon: <WorkshopIcon />, 
      title: "Workshops & Training", 
      description: "Enhance your skills with hands-on learning experiences" 
    },
    { 
      id: "open-mic-comedy", 
      path: "/category/open-mic-comedy", 
      icon: <ComedyIcon />, 
      title: "Open Mic & Comedy", 
      description: "Enjoy hilarious performances and discover new talent" 
    },
    { 
      id: "fitness-bootcamp", 
      path: "/category/fitness-bootcamp", 
      icon: <FitnessIcon />, 
      title: "Fitness & Bootcamp", 
      description: "Stay active with group workouts and fitness challenges" 
    },
    { 
      id: "music-concerts", 
      path: "/category/music-concerts", 
      icon: <MusicIcon />, 
      title: "Music & Concerts", 
      description: "Experience live music from local and touring artists" 
    },
    { 
      id: "networking-events", 
      path: "/category/networking-events", 
      icon: <NetworkingIcon />, 
      title: "Networking Events", 
      description: "Build professional connections and grow your network" 
    },
  ],
  cta: {
    title: "Can't Find Your Category?",
    description: "We're always adding new event categories based on community interest.",
    list: [
      "Food & culinary experiences",
      "Art & creative workshops", 
      "Gaming & esports tournaments",
      "Wellness & mindfulness sessions"
    ],
    buttonText: "Suggest Category"
  }
};

export const featuresMenu = {
  title: "Platform Features",
  items: [
    { 
      id: "event-management", 
      path: "/features/event-management", 
      icon: <TechIcon />, 
      title: "Event Management", 
      description: "Complete tools to create and manage successful events" 
    },
    { 
      id: "ticket-sales", 
      path: "/features/ticket-sales", 
      icon: <WorkshopIcon />, 
      title: "Ticket Sales & Analytics", 
      description: "Sell tickets online and track your event performance" 
    },
    { 
      id: "attendee-engagement", 
      path: "/features/attendee-engagement", 
      icon: <NetworkingIcon />, 
      title: "Attendee Engagement", 
      description: "Keep your audience engaged before, during, and after events" 
    },
    { 
      id: "mobile-check-in", 
      path: "/features/mobile-check-in", 
      icon: <FitnessIcon />, 
      title: "Mobile Check-in", 
      description: "Fast and easy attendee check-in with QR code scanning" 
    },
  ],
  cta: {
    title: "Ready to Host Your Event?",
    description: "Join thousands of event organizers who trust our platform.",
    buttonText: "Start Free Trial"
  }
};
