import React from 'react';
import { PlaceholderIcon } from '../../helper/Icons';

export const featuresMenu = {
  items: [
    { id: "platform-overview", path: "/features/platform-overview", icon: <PlaceholderIcon />, title: "Platform Overview", description: "Manage all your events in one place" },
    { id: "event-website-builder", path: "/features/event-website-builder", icon: <PlaceholderIcon />, title: "Event Website Builder", description: "Create branded, custom pages" },
    { id: "event-registration", path: "/features/event-registration", icon: <PlaceholderIcon />, title: "Event Registration & Ticketing", description: "Simple registration, secure payments" },
    { id: "lead-capture", path: "/features/lead-capture", icon: <PlaceholderIcon />, title: "Lead Capture For Exhibitors", description: "Gather prospect information" },
  ],
  cta:null,
};

export const categoryMenu = {
  items: [
    { id: "tech-meetups", path: "/category/tech-meetups", icon: <PlaceholderIcon />, title: "Tech Meetups", description: "Connect with the tech community" },
    { id: "workshops-training", path: "/category/workshops-training", icon: <PlaceholderIcon />, title: "Workshops & Training", description: "Enhance your skills" },
    { id: "open-mic-comedy", path: "/category/open-mic-comedy", icon: <PlaceholderIcon />, title: "Open Mic & Comedy", description: "Enjoy a night of laughter" },
    { id: "fitness-bootcamp", path: "/category/fitness-bootcamp", icon: <PlaceholderIcon />, title: "Fitness & Bootcamp", description: "Get active and healthy" },
  ],
  cta: null,
};

