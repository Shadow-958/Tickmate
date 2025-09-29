import React from "react";
import { UsersIcon, CalendarIcon, LocationIcon, TicketIcon, } from "../../helper/Icons.jsx";
import { formatDate } from "../../helper/Date.js";


const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start">
    {React.createElement(icon, { className: "h-6 w-6 text-cyan-400 mr-4 flex-shrink-0 mt-1" })}
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="font-semibold text-white">{value}</p>
    </div>
  </div>
);

const EventPreviewCard = ({ event }) => {
  const eventPrice = event.pricing.isFree ? "Free" : `₹${event.pricing.price / 100}`;
  return (
    <div className="relative w-full backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
      <img
        src={event.bannerImageUrl}
        alt="Event Banner"
        className="w-full h-48 sm:h-64 object-cover"
      />
      <div className="p-6 sm:p-8">
        <span className="inline-block bg-gray-800 text-cyan-400 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
          {event.category.replace('-', ' ')}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            {event.title}
          </span>
        </h1>
        <p className="text-gray-400 text-sm mt-2 mb-6 line-clamp-2">
          {event.description}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <DetailItem
            icon={CalendarIcon}
            label="Event Schedule"
            value={`${formatDate(event.startDateTime)} - ${formatDate(event.endDateTime)}`}
          />
          <DetailItem icon={LocationIcon} label="Location" value={event.location} />
          <DetailItem icon={TicketIcon} label="Pricing" value={eventPrice} />
          <DetailItem icon={UsersIcon} label="Capacity" value={`${event.capacity} Attendees`} />
        </div>
      </div>
    </div>
  );
};

export default EventPreviewCard;