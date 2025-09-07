import React from "react";

export default function Hero() {
  return <HeroSection />;
}

const HeroSection = () => {
  return (
    <div className="relative bg-gradient-to-br from-black via-gray-900 to-black text-white overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-500/5 to-blue-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20"></div>

      <div className="container mx-auto px-4 py-12 sm:py-32 lg:py-40 relative z-10">
        <div className="flex flex-col items-center text-center">
          <div className="group mb-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <p className="relative mb-4 text-sm font-bold uppercase tracking-widest text-cyan-400 px-6 py-3 border border-cyan-500/30 rounded-full bg-cyan-500/5 backdrop-blur-sm hover:border-cyan-400/50 hover:bg-cyan-500/10 transition-all duration-300">
                <span className="relative z-10">Event Registration Software</span>
              </p>
            </div>
          </div>

          <div className="relative mb-8">
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-5xl leading-tight">
              <span className="inline-block bg-gradient-to-b from-white via-cyan-100 to-gray-400 bg-clip-text text-transparent hover:from-cyan-200 hover:via-white hover:to-cyan-300 transition-all duration-700 animate-fade-in">
                Run Events Like a Pro.
              </span>
              <br />
              <span className="inline-block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-gradient-x">
                Without the Stress.
              </span>
            </h1>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-8 h-8 border-2 border-cyan-400 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          {/* Sub-headline paragraph with better typography */}
          <p className="mt-6 max-w-3xl text-lg sm:text-xl leading-relaxed text-gray-300 hover:text-gray-200 transition-colors duration-300">
            Launch your event site & mobile app in 
            <span className="text-cyan-400 font-semibold"> minutes</span>—no code, no clutter, no stress. 
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent font-semibold"> Powerful tools</span> to 
            boost registrations, manage sessions, engage attendees, and simplify check-in, without the steep learning curve or enterprise price tag.
          </p>

          {/* Enhanced badges/indicators with better interactions */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-3 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 backdrop-blur-sm hover:border-cyan-400/60 hover:scale-105 transition-all duration-300">
                <div className="relative">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping absolute"></div>
                  <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                </div>
                <span className="text-cyan-300 font-bold text-sm sm:text-base">Live Event Management</span>
              </div>
            </div>
            
            <div className="group relative">
              <div className="flex items-center space-x-3 px-6 py-4 rounded-full bg-gradient-to-r from-gray-800/80 to-gray-700/80 border border-gray-600/60 backdrop-blur-sm hover:border-gray-500 hover:bg-gradient-to-r hover:from-gray-700/80 hover:to-gray-600/80 hover:scale-105 transition-all duration-300">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white font-bold text-sm sm:text-base">Mobile Ready</span>
              </div>
            </div>
            
          </div>

          {/* Enhanced trust indicator with animation */}
          <div className="mt-8 relative">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400 hover:text-gray-300 transition-colors duration-300">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="font-semibold">Trusted by thousands of event organizers worldwide</span>
            </div>
            
            {/* Floating particles */}
            <div className="absolute -top-2 left-1/4 w-2 h-2 bg-cyan-400 rounded-full opacity-60 animate-float"></div>
            <div className="absolute -top-4 right-1/3 w-1 h-1 bg-blue-500 rounded-full opacity-40 animate-float" style={{ animationDelay: '2s' }}></div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-gradient-x {
          background-size: 400% 400%;
          animation: gradient-x 3s ease infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};