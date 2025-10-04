import React from "react";
import Hero from "./Hero";
import Facilities from "./Facilities";
import GettingStarted from "./GettingStarted";
import UpcomingEventsSection from "./EventList";
import AIRecommendationsSection from './AIRecommendationsSection';  // New import

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Facilities />
      <AIRecommendationsSection />  {/* New AI Recommendations Section */}
      <UpcomingEventsSection/>
      <GettingStarted/>
    </>
  );
}
