import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link, Navigate } from "react-router-dom";
import Confetti from "react-confetti";
import * as htmlToImage from 'html-to-image';
import Ticket from "./Ticket";
import { CalendarIcon, DashboardIcon, DownloadIcon } from '../../helper/Icons.jsx';


const ConfirmationPage = () => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const ticketRef = useRef(null);

  const { ticket, event } = location.state || {};

  if (!ticket || !event) {
    return <Navigate to="/" />;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleDownload = () => {
    if (!ticketRef.current) {
      console.error("Ticket element ref is not available.");
      return;
    }
    setIsLoading(true);

    htmlToImage.toPng(ticketRef.current, { cacheBust: true, pixelRatio: 2 })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `${event.title.replace(/\s+/g, '-')}-ticket.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Failed to download ticket image:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {showConfetti && <Confetti recycle={false} numberOfPieces={400} />}
      <div className="container mx-auto px-4 py-12 sm:py-16 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              Booking Successful!
            </span>
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Your ticket is confirmed. Get ready for an amazing event!
          </p>
        </div>

        <div className="flex flex-col items-center gap-8">
          <div ref={ticketRef} className="w-full max-w-4xl">
            <Ticket event={event} ticket={ticket} />
          </div>

          <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/allevents"
              className="group flex items-center justify-center w-full bg-gray-800/50 border border-gray-700 text-white font-semibold px-6 py-4 rounded-lg transition-all duration-300 hover:bg-cyan-500/10 hover:border-cyan-500 hover:scale-105"
            >
              <CalendarIcon className="h-5 w-5 mr-3 text-gray-400 group-hover:text-cyan-400 transition-colors" />
              Browse All Events
            </Link>
            <Link
              to="/my-bookings"
              className="group flex items-center justify-center w-full bg-gray-800/50 border border-gray-700 text-white font-semibold px-6 py-4 rounded-lg transition-all duration-300 hover:bg-cyan-500/10 hover:border-cyan-500 hover:scale-105"
            >
              <DashboardIcon className="h-5 w-5 mr-3 text-gray-400 group-hover:text-cyan-400 transition-colors" />
              Go to My Dashboard
            </Link>
            <button 
              onClick={handleDownload}
              disabled={isLoading}
              className="sm:col-span-2 group flex items-center justify-center w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold px-6 py-4 rounded-lg transition-all duration-300 hover:from-cyan-600 hover:to-blue-600 hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-105 transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DownloadIcon className="h-5 w-5 mr-3 group-hover:animate-bounce" />
              {isLoading ? 'Downloading...' : 'Download Ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;
