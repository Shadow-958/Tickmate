import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import EventCard from '../../components/attendee/EventCard';
import apiClient from '../../utils/apiClient';

const AIRecommendationsSection = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.selectedRole === 'event_attendee') {
      fetchRecommendations();
    }
  }, [user]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/ai/recommendations/${user._id}`);
      setRecommendations(response.recommendations || []);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.selectedRole !== 'event_attendee' || loading) {
    return null;
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="bg-black text-white py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <header className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              🤖 Recommended for You
            </span>
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
            Based on your interests and activity, here are some events you might love.
          </p>
        </header>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {recommendations.slice(0, 4).map(event => (
            <div key={event._id} className="relative">
              <EventCard event={event} />
              {event.recommendationReason && (
                <div className="absolute top-2 right-2 bg-cyan-500 text-black text-xs px-2 py-1 rounded-full">
                  AI Pick
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AIRecommendationsSection;
