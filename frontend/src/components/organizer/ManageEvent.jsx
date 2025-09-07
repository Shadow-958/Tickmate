import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { UsersIcon, CalendarIcon, LocationIcon, TicketIcon, UserGroupIcon } from "../../helper/Icons.jsx";
import { formatDate } from "../../helper/Date.js";


const DetailItem = ({ icon: Icon, label, value }) => (
  <div>
    <div className="flex items-center">
      {Icon && <Icon className="h-6 w-6 text-cyan-400 mr-3" />}
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="font-semibold text-white">{value}</p>
      </div>
    </div>
  </div>
);

const EventPreview = ({ event, eventId }) => (
  <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
    <div className="lg:w-3/5">
      <img
        src={event.bannerImageUrl}
        alt={event.title}
        className="w-full h-auto object-cover rounded-2xl shadow-lg shadow-cyan-500/10"
      />
    </div>

    <div className="lg:w-2/5 flex flex-col">
      <div>
        <span className="inline-block bg-gray-800 text-cyan-400 text-sm font-semibold px-4 py-1 rounded-full uppercase tracking-wider">
          {event.category.replace('-', ' ')}
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight my-4">
          <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            {event.title}
          </span>
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-8 border-y border-gray-800 py-8">
        <DetailItem
          icon={CalendarIcon}
          label="Start Date & Time"
          value={formatDate(event.startDateTime)}
        />
        <DetailItem
          icon={CalendarIcon}
          label="End Date & Time"
          value={formatDate(event.endDateTime)}
        />
        <DetailItem
          icon={LocationIcon}
          label="Location"
          value={event.location}
        />
        <DetailItem 
          icon={TicketIcon} 
          label="Pricing" 
          value={event.pricing.isFree ? 'Free' : `₹${event.pricing.price / 100}`} 
        />
      </div>

      {/* Moved View Attendee List button right here, below Location and Pricing */}
      <Link
        to={`/attendee-list/${eventId}`}
        className="inline-flex items-center justify-center w-full bg-cyan-500 text-black font-bold rounded-full px-8 py-4 text-lg transition-all mt-4"
      >
        <UsersIcon className="h-6 w-6 mr-3" />
        View Attendee List
      </Link>
    </div>
  </div>
);


const ManageEventPage = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) throw new Error("Event not found.");
        const data = await response.json();
        setEvent(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEventDetails();
  }, [eventId]);

  if (loading) return <div className="bg-black text-white text-center p-20 pt-40">Loading Event Details...</div>;
  if (error) return <div className="bg-black text-red-500 text-center p-20 pt-40">Error: {error}</div>;

  return (
    <main className="bg-black text-white py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              Manage Event
            </span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
            Here's a preview of your event page. Use the tools below to manage your attendees.
          </p>
        </header>

        <section className="mb-12">
          {event && <EventPreview event={event} eventId={eventId} />}
        </section>
      </div>
    </main>
  );
};

export default ManageEventPage;
