import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const steps = [
  {
    id: 1,
    title: "Create Your Account",
    description: "Sign up as an event organizer and set up your profile in minutes.",
    icon: "👤",
    action: "Sign Up Now",
    features: [
      "Choose your role (Host, Attendee, or Staff)",
      "Complete profile setup",
      "Verify your email address"
    ],
    image: "https://images.unsplash.com/photo-1486312338219-ce68e2c6e4b4?w=500&h=300&fit=crop&crop=center"
  },
  {
    id: 2,
    title: "Create Your First Event",
    description: "Use our intuitive event builder to create professional events effortlessly.",
    icon: "🎪",
    action: "Create Event",
    features: [
      "Event details and scheduling",
      "Ticket pricing and categories",
      "Location and venue setup"
    ],
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=500&h=300&fit=crop&crop=center"
  },
  {
    id: 3,
    title: "Manage Attendees",
    description: "Track registrations, manage attendees, and scan tickets in real-time.",
    icon: "👥",
    action: "View Dashboard",
    features: [
      "Real-time attendee tracking",
      "QR code ticket scanning",
      "Check-in management"
    ],
    image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&h=300&fit=crop&crop=center"
  },
  {
    id: 4,
    title: "Analytics & Reports",
    description: "Get detailed insights about your events and attendee engagement.",
    icon: "📊",
    action: "View Analytics",
    features: [
      "Revenue tracking",
      "Attendance statistics",
      "Export detailed reports"
    ],
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop&crop=center"
  }
];

export default function GettingStarted() {
  const [activeStep, setActiveStep] = useState(1);
  const { isAuthenticated, isHost } = useAuth();
  const navigate = useNavigate();

  const handleAction = (stepId) => {
    switch (stepId) {
      case 1:
        if (!isAuthenticated) {
          navigate("/register");
        } else {
          navigate("/organizer-dashboard");
        }
        break;
      case 2:
        if (isAuthenticated && isHost) {
          navigate("/newEvent");
        } else {
          navigate("/register");
        }
        break;
      case 3:
        if (isAuthenticated && isHost) {
          navigate("/organizer-dashboard");
        } else {
          navigate("/register");
        }
        break;
      case 4:
        if (isAuthenticated && isHost) {
          navigate("/organizer-dashboard");
        } else {
          navigate("/register");
        }
        break;
      default:
        navigate("/register");
    }
  };

  const currentStep = steps.find(step => step.id === activeStep);

  return (
    <div className="bg-black py-12 sm:py-16 lg:py-24">
      <section className="bg-black text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs sm:text-sm font-medium uppercase tracking-wider text-cyan-400 mb-3 sm:mb-4">
              START YOUR EVENT JOURNEY
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
                Get Started in 
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                4 Simple Steps
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed px-2">
              From account creation to advanced analytics, TickMate makes event management effortless and professional.
            </p>
          </div>

          {/* Step Navigation */}
          <div className="mb-12 sm:mb-16">
            {/* Mobile: Vertical Layout */}
            <div className="block lg:hidden">
              <div className="flex justify-center mb-6">
                <div className="grid grid-cols-4 gap-3 sm:gap-4">
                  {steps.map((step) => (
                    <button
                      key={step.id}
                      onClick={() => setActiveStep(step.id)}
                      className={`flex flex-col items-center justify-center w-16 h-16 sm:w-18 sm:h-18 rounded-full text-lg sm:text-xl font-bold transition-all duration-300 ${
                        activeStep === step.id
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white scale-110 shadow-lg shadow-cyan-500/25'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white hover:scale-105'
                      }`}
                    >
                      <span className="relative z-10">{step.icon}</span>
                      {activeStep === step.id && (
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-pulse opacity-50"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Mobile Step Labels */}
              <div className="grid grid-cols-4 gap-2 text-center">
                {steps.map((step) => (
                  <div key={`mobile-label-${step.id}`}>
                    <p className={`text-xs font-medium transition-colors duration-300 ${
                      activeStep === step.id ? 'text-cyan-400' : 'text-gray-500'
                    }`}>
                      Step {step.id}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: Horizontal Layout */}
            <div className="hidden lg:block">
              <div className="flex justify-center items-center space-x-8">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => setActiveStep(step.id)}
                      className={`group relative flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold transition-all duration-300 ${
                        activeStep === step.id
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white scale-110 shadow-lg shadow-cyan-500/25'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white hover:scale-105'
                      }`}
                    >
                      <span className="relative z-10">{step.icon}</span>
                      {activeStep === step.id && (
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-pulse opacity-50"></div>
                      )}
                    </button>
                    
                    {/* Step connector (hide on last item) */}
                    {index < steps.length - 1 && (
                      <div className="w-20 h-0.5 bg-gray-700 ml-4">
                        <div 
                          className={`h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 ${
                            step.id < activeStep ? 'w-full' : 'w-0'
                          }`}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Step Labels */}
              <div className="flex justify-center items-center space-x-8 mt-6">
                {steps.map((step) => (
                  <div key={`desktop-label-${step.id}`} className="text-center w-32">
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      activeStep === step.id ? 'text-cyan-400' : 'text-gray-500'
                    }`}>
                      Step {step.id}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active Step Content */}
          <div className="mb-12 sm:mb-16">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
              {/* Left Column: Content */}
              <div className="text-center lg:text-left w-full lg:w-1/2 space-y-6 lg:space-y-8">
                <div>
                  <div className="flex items-center justify-center lg:justify-start mb-4 sm:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-xl sm:text-2xl mr-3 sm:mr-4">
                      {currentStep.icon}
                    </div>
                    <div className="text-left">
                      <p className="text-xs sm:text-sm text-cyan-400 font-medium">STEP {currentStep.id}</p>
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                        {currentStep.title}
                      </h3>
                    </div>
                  </div>
                  
                  <p className="text-base sm:text-lg text-gray-300 leading-relaxed mb-6 sm:mb-8 px-2 lg:px-0">
                    {currentStep.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-3 sm:space-y-4">
                  {currentStep.features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-center lg:justify-start px-4 lg:px-0">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3 flex-shrink-0"></div>
                      <span className="text-sm sm:text-base text-gray-300 text-left">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  <button
                    onClick={() => handleAction(currentStep.id)}
                    className="group bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-full transition-all duration-300 hover:from-cyan-600 hover:to-blue-600 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 transform text-sm sm:text-base w-full sm:w-auto"
                  >
                    <span className="flex items-center justify-center">
                      {currentStep.action}
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>

              {/* Right Column: Image/Visual */}
              <div className="flex justify-center w-full lg:w-1/2 mt-8 lg:mt-0">
                <div className="relative group w-full max-w-sm lg:max-w-md">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <img
                    src={currentStep.image}
                    alt={currentStep.title}
                    className="relative z-10 rounded-2xl shadow-2xl w-full h-auto transform group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/500x300/111827/4f46e5?text=" + encodeURIComponent(currentStep.title);
                    }}
                  />
                  
                  {/* Overlay with step number */}
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 bg-black/80 rounded-full flex items-center justify-center text-cyan-400 font-bold text-sm sm:text-lg z-20">
                    {currentStep.id}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border border-gray-700 mx-2 sm:mx-0">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4">
                Ready to Create Amazing Events?
              </h3>
              <p className="text-base sm:text-lg text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
                Join thousands of event organizers who trust TickMate for their event management needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2 sm:px-0">
                <button
                  onClick={() => navigate("/register")}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 text-sm sm:text-base w-full sm:w-auto"
                >
                  Get Started Free
                </button>
                <button
                  onClick={() => navigate("/events")}
                  className="border-2 border-gray-600 text-gray-200 font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:bg-white hover:text-black transition-all duration-300 hover:scale-105 text-sm sm:text-base w-full sm:w-auto"
                >
                  Browse Events
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
