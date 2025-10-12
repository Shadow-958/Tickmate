import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();

  // Creator data - you can update this with your team information
  const creators = [
    {
      id: 1,
      name: "Your Name",
      role: "Full Stack Developer",
      description: "Backend architecture and API development specialist.",
      image: "/images/creator1.jpg", // Replace with your image path
      social: {
        linkedin: "#",
        github: "#",
        twitter: "#"
      }
    },
    {
      id: 2,
      name: "Team Member 2",
      role: "Frontend Developer",
      description: "UI/UX design and React development expert.",
      image: "/images/creator2.jpg", // Replace with your image path
      social: {
        linkedin: "#",
        github: "#",
        twitter: "#"
      }
    },
    {
      id: 3,
      name: "Team Member 3",
      role: "DevOps Engineer",
      description: "Infrastructure and deployment automation specialist.",
      image: "/images/creator3.jpg", // Replace with your image path
      social: {
        linkedin: "#",
        github: "#",
        twitter: "#"
      }
    },
    {
      id: 4,
      name: "Team Member 4",
      role: "Product Designer",
      description: "User experience and interface design leader.",
      image: "/images/creator4.jpg", // Replace with your image path
      social: {
        linkedin: "#",
        github: "#",
        twitter: "#"
      }
    }
  ];

  return (
    <div className="bg-black">
      <footer className="bg-black border-t border-gray-800 text-gray-400">
        <div className="container mx-auto px-4 py-12">


          {/* --- About Section --- */}
          <div id="about" className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-6">About TickMate</h2>
              <div className="max-w-4xl mx-auto">
                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                  TickMate is a revolutionary event management platform designed to streamline the entire event lifecycle, 
                  from creation to execution. Built with modern technology and user-centric design, TickMate empowers 
                  event organizers, attendees, and staff with powerful tools and seamless experiences.
                </p>
              </div>
            </div>
          </div>

          {/* --- Creator Cards Section --- */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold text-white mb-4">Meet the Creators</h3>
              <p className="text-gray-400 max-w-2xl mx-auto">
                The talented team behind TickMate, passionate about revolutionizing event management.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {creators.map((creator) => (
                <div
                  key={creator.id}
                  className="group relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 hover:border-cyan-500/50 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/20"
                >
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    {/* Image */}
                    <div className="mb-4 relative">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 p-0.5 group-hover:scale-110 transition-transform duration-300">
                        <img
                          src={creator.image}
                          alt={creator.name}
                          className="w-full h-full rounded-full object-cover bg-gray-700"
                          onError={(e) => {
                            // Fallback to initials if image fails to load
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        {/* Fallback initials */}
                        <div 
                          className="w-full h-full rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 hidden items-center justify-center text-white font-bold text-xl"
                          style={{ display: 'none' }}
                        >
                          {creator.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      </div>
                      {/* Online indicator */}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-gray-900 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>

                    {/* Name and Role */}
                    <div className="text-center mb-3">
                      <h4 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors duration-300">
                        {creator.name}
                      </h4>
                      <p className="text-cyan-400 text-sm font-medium">
                        {creator.role}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-gray-400 text-sm text-center mb-4 leading-relaxed">
                      {creator.description}
                    </p>

                    {/* Social Links */}
                    <div className="flex justify-center space-x-3">
                      <a
                        href={creator.social.linkedin}
                        className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all duration-200 transform hover:scale-110"
                        aria-label="LinkedIn"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                      <a
                        href={creator.social.github}
                        className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-600 hover:text-white transition-all duration-200 transform hover:scale-110"
                        aria-label="GitHub"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </a>
                      <a
                        href={creator.social.twitter}
                        className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-blue-400 hover:text-white transition-all duration-200 transform hover:scale-110"
                        aria-label="Twitter"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                      </a>
                    </div>
                  </div>

                  {/* Animated border */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-transparent to-blue-500/20 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- Footer Bottom Bar --- */}
        <div className="bg-gray-900 py-4 border-t border-gray-800">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm">
              <p>&copy; {year} TickMate. All Rights Reserved.</p>
              <div className="flex space-x-6 mt-2 md:mt-0">
                <a href="#privacy" className="hover:text-cyan-400 transition-colors">
                  Privacy Policy
                </a>
                <a href="#terms" className="hover:text-cyan-400 transition-colors">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
