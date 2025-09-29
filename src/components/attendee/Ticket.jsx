// src/components/attendee/Ticket.jsx
import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { CalendarIcon, LocationIcon } from "../../helper/Icons.jsx";

// --- Helper function to format dates ---
const formatDate = (dateString, options) => {
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// --- The Ticket Component (Enhanced Left Section) ---
const Ticket = ({ event, ticket }) => {
  const { user } = useAuth();

  if (!event || !ticket) {
    return (
        <div className="text-center text-red-500 p-4 bg-gray-800 rounded-lg">
            Ticket data is missing.
        </div>
    );
  }

  const eventDate = formatDate(event.startDateTime, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const eventTime = new Date(event.startDateTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const bookedOn = formatDate(ticket.bookingDate || ticket.createdAt, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="group relative w-full bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
      <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50 transform -skew-x-12 transition-transform duration-700 ease-in-out group-hover:translate-x-[200%]"></div>
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10 blur-sm"
        style={{ backgroundImage: `url(${event.bannerImageUrl})` }}
      ></div>

      <div className="relative flex flex-col md:flex-row">
        {/* --- Enhanced Main Body Section --- */}
        <div className="flex-grow p-6 sm:p-8 flex flex-col justify-center">

          {/* Event Title with enhanced styling */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight mb-2">
              <span className="bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent">
                {event.title}
              </span>
            </h1>
          </div>

          {/* Event Details - Card Style to match right section */}
          <div className="space-y-4">

            {/* Date & Time Card */}
            <div className="p-4 bg-black/20 rounded-xl border border-gray-600/30 backdrop-blur-sm hover:border-cyan-400/40 transition-all duration-300 group/date">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-lg mr-4 border border-cyan-500/20 group-hover/date:border-cyan-400/40 transition-colors">
                  <CalendarIcon className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="flex-grow">
                  <p className="text-xs uppercase tracking-wide text-cyan-400 font-bold mb-1">Date & Time</p>
                  <p className="font-bold text-white text-lg">{eventDate}</p>
                  <p className="font-semibold text-cyan-300 text-sm">{eventTime}</p>
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div className="p-4 bg-black/20 rounded-xl border border-gray-600/30 backdrop-blur-sm hover:border-purple-400/40 transition-all duration-300 group/location">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg mr-4 border border-purple-500/20 group-hover/location:border-purple-400/40 transition-colors">
                  <LocationIcon className="h-5 w-5 text-purple-400" />
                </div>
                <div className="flex-grow">
                  <p className="text-xs uppercase tracking-wide text-purple-400 font-bold mb-1">Venue</p>
                  <p className="font-bold text-white text-lg leading-tight">{event.location.venue || event.location}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* --- Perforated Divider --- */}
        <div className="relative flex-shrink-0">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-black rounded-full md:left-0 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2"></div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-black rounded-full md:left-0 md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2"></div>
          <div className="h-full w-px border-l-2 border-dashed border-gray-600 hidden md:block mx-4"></div>
          <div className="w-full h-px border-t-2 border-dashed border-gray-600 md:hidden my-4"></div>
        </div>

        {/* --- Stub Section with QR Code --- */}
        <div className="flex-shrink-0 w-full md:w-2/5 p-6 sm:p-8 flex flex-col items-center justify-center text-center">
          <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-bold mb-2">
            Scan at Entry
          </h2>

          {/* --- QR CODE IMAGE --- */}
          <div className="bg-white p-2 rounded-lg">
            <img 
              src={ticket.qrCodeUrl} 
              alt="Ticket QR Code"
              className="w-32 h-32 md:w-40 md:h-40"
            />
          </div>

          <div className="text-xs sm:text-sm text-gray-400 mt-4">
            <p>
              <span className="font-semibold">Admitted:</span>{" "}
              {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Ticket Holder'}
            </p>
            <p>
              <span className="font-semibold">Booked on:</span> {bookedOn}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ticket;