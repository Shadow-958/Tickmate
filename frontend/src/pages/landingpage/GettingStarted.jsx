import React from "react";



export default function GettingStarted() {
  return (
    <div className="bg-black py-10">
      <section className="bg-black text-white py-16 sm:py-24">
        <div className="container mx-auto px-4">
          {/* Main container: flex-col on mobile, row on large screens */}
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
            {/* Left Column: Text Content */}
            <div className="text-center lg:text-left lg:w-1/2">
              <p className="text-sm font-medium uppercase tracking-wider text-cyan-400 mb-2">
                EVENT CREATION & SETUP
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6">
                <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
                  Get Started Quickly
                </span>
              </h2>

              <div className="border-b border-gray-700 mb-8">
                <nav
                  className="-mb-px flex justify-center lg:justify-start space-x-8"
                  aria-label="Tabs"
                >
                  <span className="border-cyan-500 text-cyan-400 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-md">
                    Event Registration & Ticketing
                  </span>
                </nav>
              </div>

              <h3 className="text-xl font-bold text-white">Sign them up</h3>
              <p className="mt-3 text-base text-gray-300">
                Effortless registration and ticketing, because first impressions
                matter.
              </p>

              <a
                href="#"
                className="group mt-8 inline-flex items-center justify-center rounded-full border-2 border-gray-600 px-7 py-2.5 text-sm font-bold text-gray-200 transition-all duration-300 ease-in-out hover:bg-cyan-500 hover:text-white hover:border-cyan-500"
              >
                Learn more
              </a>
            </div>

            {/* Right Column: Image (order-first on mobile to appear below text) */}
            <div className="flex justify-center lg:w-1/2">
              <img
                src="https://placehold.co/600x450/111827/4f46e5?text=Platform+UI"
                alt="Event Platform Showcase"
                className="rounded-lg shadow-2xl max-w-md w-full h-auto"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://placehold.co/600x450/111827/FFFFFF?text=Image+Not+Found";
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

