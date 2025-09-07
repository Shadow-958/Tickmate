import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { CalendarIcon, LocationIcon, UserGroupIcon } from '../../helper/Icons.jsx';



// --- Helper function to format dates ---
const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// --- Detail Item Component for reusability ---
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

const EventDetailPage = () => {
  const { eventId } = useParams();
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate(); 

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingStatus, setBookingStatus] = useState('');

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) throw new Error('Event not found');
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

  const handlePayment = async () => {
    if (!user) {
      openSignIn({ afterSignInUrl: `/events/${eventId}` });
      return;
    }

    setBookingStatus('Processing...');

    if (event.pricing.isFree) {
        try {
            const response = await fetch('/api/tickets/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId: event._id, clerkId: user.id }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Booking failed');
            
            navigate('/confirmation', { state: { ticket: data.ticket, event: event } });
        } catch (err) {
            setBookingStatus(`Error: ${err.message}`);
        }
        return;
    }

    try {
        const orderResponse = await fetch('/api/payments/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId: event._id }),
        });

        const orderData = await orderResponse.json();
        if (!orderResponse.ok) throw new Error(orderData.message || 'Could not create order.');

        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: orderData.amount,
            currency: orderData.currency,
            name: "Eventzilla",
            description: `Ticket for ${event.title}`,
            order_id: orderData.id,
            handler: async function (response) {
                const verificationResponse = await fetch('/api/payments/verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature,
                        eventId: event._id,
                        clerkId: user.id
                    })
                });

                const verificationData = await verificationResponse.json();
                if (verificationResponse.ok) {
                    navigate('/confirmation', { state: { ticket: verificationData.ticket, event: event } });
                } else {
                    setBookingStatus(`Error: ${verificationData.message || 'Payment verification failed.'}`);
                }
            },
            prefill: {
                name: user.fullName || "",
                email: user.primaryEmailAddress.emailAddress || "",
            },
            theme: { color: "#06b6d4" }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        
        setBookingStatus('');

    } catch (err) {
        setBookingStatus(`Error: ${err.message}`);
    }
  };

  if (loading) return <div className="bg-black text-white text-center p-20">Loading...</div>;
  if (error) return <div className="bg-black text-red-500 text-center p-20">Error: {error}</div>;
  if (!event) return <div className="bg-black text-white text-center p-20">Event not found.</div>;

  const ticketsSold = event.ticketsSold || 0;
  const seatsLeft = event.capacity - ticketsSold;

  return (
    <section className="bg-black text-white min-h-screen">
       <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          <div className="lg:w-3/5">
            <img
              src={event.bannerImageUrl || 'https://placehold.co/1200x600/000000/FFFFFF?text=Event'}
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
              <DetailItem icon={CalendarIcon} label="Starts On" value={formatDate(event.startDateTime)} />
              <DetailItem icon={LocationIcon} label="Location" value={event.location} />
              <DetailItem icon={UserGroupIcon} label="Capacity" value={`${event.capacity} Attendees`} />
              <DetailItem icon={UserGroupIcon} label="Hosted By" value={event.organizer?.firstName || 'Eventzilla Host'} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">About this event</h2>
              <p className="text-gray-300 leading-relaxed mb-8">
                {event.description}
              </p>
            </div>
            <div className="mt-auto pt-8">
              <div className="relative text-center mb-4 p-3 rounded-lg bg-gray-900 border border-gray-700 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-blue-600/30 opacity-75 blur-lg animate-pulse"></div>
                <p className="relative z-10 font-bold text-lg text-white">
                  Only <span className="text-cyan-400">{seatsLeft > 0 ? seatsLeft : 0}</span> seats left!
                </p>
              </div>
              <button 
                onClick={handlePayment}
                disabled={bookingStatus === 'Processing...'}
                className="w-full bg-cyan-500 text-black font-bold rounded-full px-8 py-4 text-lg transition-all duration-300 ease-in-out hover:bg-cyan-600 hover:shadow-lg hover:shadow-cyan-500/30 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bookingStatus === 'Processing...' ? 'Processing...' : `Buy Ticket for ${event.pricing.isFree ? 'Free' : `₹${event.pricing.price / 100}`}`}
              </button>
              {bookingStatus.startsWith('Error:') && <p className="mt-4 text-center font-semibold text-red-500">{bookingStatus}</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventDetailPage;
