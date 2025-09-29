import  { useState, useEffect } from "react";
import { useLocation, Link, Navigate } from 'react-router-dom';
import Confetti from "react-confetti";
import { DashboardIcon, EyeIcon, LinkIcon } from "../../helper/Icons.jsx";
import EventPreviewCard from "./EventPreviewCard.jsx";


// --- Main Page Component ---
const EventPreviewPage = () => {
  const [showConfetti, setShowConfetti] = useState(true);
  const location = useLocation();

  const { newEvent } = location.state || {};

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  if (!newEvent) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden pt-24">
      {showConfetti && <Confetti recycle={false} numberOfPieces={400} />}
      <div className="container mx-auto px-4 py-12 sm:py-16 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              Your Event is Live!
            </span>
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Congratulations! Your event has been successfully created.
          </p>
        </div>

        <div className="flex flex-col items-center gap-8">
          <div className="w-full max-w-3xl">
            <EventPreviewCard event={newEvent} />
          </div>
          
          <div className="w-full max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to={`/manage-event/${newEvent._id}`}
              className="group flex items-center justify-center w-full bg-cyan-500 text-black font-bold px-6 py-4 rounded-lg transition-all duration-300 hover:bg-cyan-600"
            >
              <EyeIcon className="h-6 w-6 mr-3" />
              View Live Event Page
            </Link>

            <Link
              to="/organizer-dashboard"
              className="sm:col-span-2 group flex items-center justify-center w-full bg-gray-800/50 border border-gray-700 text-white font-semibold px-6 py-4 rounded-lg transition-all duration-300 hover:border-cyan-500"
            >
              <DashboardIcon className="h-6 w-6 mr-3 text-gray-400 group-hover:text-cyan-400" />
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPreviewPage;
