import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DotsVerticalIcon, CalendarIcon, LocationIcon } from "../../helper/Icons.jsx";
// --- Helper to determine event status ---

const getEventStatus = (start, end) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (startDate > now) return "Upcoming";
    if (endDate < now) return "Completed";
    return "Live";
};

// --- REUSABLE COMPONENTS ---
export const EventStatusTag = ({ status }) => {
  const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full";
  const statusClasses = { Live: "bg-green-500/10 text-green-400", Upcoming: "bg-yellow-500/10 text-yellow-400", Completed: "bg-gray-500/10 text-gray-400", Draft: "bg-purple-500/10 text-purple-400" };
  return ( <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span> );
};

export const StatCard = ({ title, value, detail }) => (
  <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
    <p className="text-sm font-medium text-gray-400">{title}</p>
    <p className="text-3xl font-bold text-white mt-1">{value}</p>
    {detail && <p className="text-xs text-gray-500 mt-2">{detail}</p>}
  </div>
);

export const EventCard = ({ event }) => {
  const eventPrice = event.pricing.isFree ? 'Free' : `₹${event.pricing.price / 100}`;
  const eventDate = new Date(event.startDateTime).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Link to={`/manage-event/${event._id}`} className="group relative block h-full transform transition-transform duration-500 ease-in-out hover:scale-105">
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 blur transition duration-500 group-hover:opacity-75"></div>
      <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-b from-gray-900 to-black">
        <img src={event.bannerImageUrl || 'https://placehold.co/600x400/000000/FFFFFF?text=Event'} alt={event.title} className="w-full h-48 object-cover" />
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-xl font-bold text-white mb-2 truncate">{event.title}</h3>
          <div className="space-y-3 text-gray-300">
            <div className="flex items-center"><CalendarIcon className="h-5 w-5 mr-2" /><span>{eventDate}</span></div>
            <div className="flex items-center"><LocationIcon className="h-5 w-5 mr-2" /><span>{event.location}</span></div>
          </div>
          <div className="mt-6 flex justify-between items-center">
            <p className="text-lg font-semibold text-cyan-400">{eventPrice}</p>
            <div className="rounded-md bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors duration-300 group-hover:bg-cyan-500">Manage Event</div>
          </div>
        </div>
      </div>
    </Link>
  );
};

// --- SECTION COMPONENTS ---
export const DashboardSection = ({ events, handleDeleteEvent }) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const navigate = useNavigate();
  const toggleMenu = (eventId) => setOpenMenuId(openMenuId === eventId ? null : eventId);

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-6">All My Events</h2>
      <div className="hidden md:block backdrop-blur-md bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-800/50"><tr><th className="p-4 text-sm font-semibold text-gray-300">Event Title</th><th className="p-4 text-sm font-semibold text-gray-300">Status</th><th className="p-4 text-sm font-semibold text-gray-300">Date</th><th className="p-4 text-sm font-semibold text-gray-300">Sold / Capacity</th><th className="p-4 text-sm font-semibold text-gray-300">Revenue</th><th className="p-4 text-sm font-semibold text-gray-300">Actions</th></tr></thead>
          <tbody>
            {events.map((event) => (
              <tr key={event._id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                <td className="p-4 font-medium text-white">{event.title}</td>
                <td className="p-4"><EventStatusTag status={getEventStatus(event.startDateTime, event.endDateTime)} /></td>
                <td className="p-4 text-gray-300">{new Date(event.startDateTime).toLocaleDateString()}</td>
                <td className="p-4 text-gray-300">{event.ticketsSold} / {event.capacity}</td>
                <td className="p-4 text-gray-300">₹{((event.ticketsSold * event.pricing.price) / 100).toLocaleString("en-IN")}</td>
                <td className="p-4 relative">
                  <button onClick={() => toggleMenu(event._id)} className="text-gray-400 hover:text-white"><DotsVerticalIcon className="h-5 w-5" /></button>
                  {openMenuId === event._id && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                      <button onClick={() => navigate(`/manage-event/${event._id}`)} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">Manage Event</button>
                      <button onClick={() => { handleDeleteEvent(event._id); toggleMenu(null); }} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700">Delete Event</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden space-y-4">
        {events.map((event) => (
          <div key={event._id} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div><p className="font-bold text-white">{event.title}</p><p className="text-sm text-gray-400">{new Date(event.startDateTime).toLocaleDateString()}</p></div>
              <EventStatusTag status={getEventStatus(event.startDateTime, event.endDateTime)} />
            </div>
            <div className="mt-4 flex justify-between items-center text-sm">
              <p className="text-gray-300"><strong>Sold:</strong> {event.ticketsSold} / {event.capacity}</p>
              <p className="text-gray-300"><strong>Revenue:</strong> ₹{((event.ticketsSold * event.pricing.price) / 100).toLocaleString("en-IN")}</p>
              <button onClick={() => navigate(`/manage-event/${event._id}`)} className="text-gray-400 hover:text-white">Manage</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const EventsListSection = ({ title, events }) => (
    <div>
        <h2 className="text-3xl font-bold text-white mb-6">{title}</h2>
        {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => <EventCard key={event._id} event={event} />)}
            </div>
        ) : <p className="text-gray-400">No {title.toLowerCase()} events found.</p>}
    </div>
);

export const RevenueAnalyticsSection = ({ analytics }) => (
  <div>
    <h2 className="text-3xl font-bold text-white mb-6">Revenue Analytics</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <StatCard title="Total Revenue" value={`₹${analytics.totalRevenue.toLocaleString("en-IN")}`} />
      <StatCard title="Total Tickets Sold" value={analytics.totalTicketsSold} />
      <StatCard title="Upcoming Events" value={analytics.upcomingEventsCount} />
    </div>
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 h-96">
      <h3 className="text-lg font-semibold text-white mb-4">Revenue by Event</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={analytics.revenueByEvent} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value.toLocaleString()}`} />
          <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#e5e7eb" }} cursor={{ fill: "rgba(14, 165, 233, 0.1)" }} />
          <Legend iconSize={10} />
          <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);
