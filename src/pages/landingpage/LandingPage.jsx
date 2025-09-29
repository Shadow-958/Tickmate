import React from "react";
import Hero from "./Hero";
import Facilities from "./Facilities";
import GettingStarted from "./GettingStarted";
import UpcomingEventsSection from "./EventList";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Facilities />
      <UpcomingEventsSection/>
      <GettingStarted/>
    </>
  );
}
