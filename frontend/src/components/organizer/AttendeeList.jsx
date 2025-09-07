import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { QrCodeIcon } from "../../helper/Icons.jsx";


const StatusPill = ({ isCheckedIn }) => (
  <div className="flex items-center">
    <div className={`h-2.5 w-2.5 rounded-full mr-2 ${isCheckedIn ? "bg-green-400" : "bg-yellow-400"}`}></div>
    <span className={isCheckedIn ? "text-green-400" : "text-yellow-400"}>
      {isCheckedIn ? "Checked In" : "Not Checked In"}
    </span>
  </div>
);

// --- Main Attendee List Page Component ---
const AttendeeListPage = () => {
  const { eventId } = useParams();
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttendees = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/organizer/events/${eventId}/attendees`);
        if (!response.ok) {
          throw new Error("Failed to fetch attendee list.");
        }
        const data = await response.json();
        setAttendees(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendees();
  }, [eventId]);

  if (loading) return <div className="bg-black text-white text-center p-20 pt-40">Loading Attendees...</div>;
  if (error) return <div className="bg-black text-red-500 text-center p-20 pt-40">Error: {error}</div>;

  return (
    <div className="bg-black min-h-screen text-white p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto">
        <header className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
                Event Attendees
              </span>
            </h1>
            <p className="mt-2 text-lg text-gray-400">
              Manage and verify your event attendees.
            </p>
          </div>
          <Link
            to={`/scanner/${eventId}`}
            className="w-full md:w-auto flex items-center justify-center bg-cyan-500 text-black font-bold rounded-full px-6 py-3 transition-all"
          >
            <QrCodeIcon className="h-6 w-6 mr-2" />
            Open Ticket Scanner
          </Link>
        </header>

        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="p-4 text-sm font-semibold text-gray-300">S.No.</th>
                  <th className="p-4 text-sm font-semibold text-gray-300">Attendee Name</th>
                  <th className="p-4 text-sm font-semibold text-gray-300">Email</th>
                  <th className="p-4 text-sm font-semibold text-gray-300">Purchase Date</th>
                  <th className="p-4 text-sm font-semibold text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((ticket, index) => (
                  <tr key={ticket._id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 font-medium text-white">{index + 1}</td>
                    <td className="p-4 text-gray-300">{ticket.attendeeId?.firstName || 'N/A'} {ticket.attendeeId?.lastName}</td>
                    <td className="p-4 text-gray-300">{ticket.attendeeId?.email}</td>
                    <td className="p-4 text-gray-300">{new Date(ticket.purchaseDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      <StatusPill isCheckedIn={ticket.isCheckedIn} /> 
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendeeListPage;
