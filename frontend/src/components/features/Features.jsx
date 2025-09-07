import React from 'react';
import { useParams } from 'react-router-dom';
import NotFoundPage from '../../helper/Notfound';

const Feature = () => {
  // Get the specific feature ID from the URL
  const { featureId } = useParams();

  // This function acts as a router to select the correct component to render
  const renderFeatureComponent = () => {
    switch (featureId) {
      case 'platform-overview':
        return <PlatformOverview />;
      case 'event-website-builder':
        return <EventWebsiteBuilder />;
      default:
        // If the featureId in the URL doesn't match any case, show a 404 page
        return <NotFoundPage />;
    }
  };

  return (
    <div>
      {renderFeatureComponent()}
    </div>
  );
};

export default Feature;
