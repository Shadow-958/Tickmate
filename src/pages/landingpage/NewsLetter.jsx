import React, { useState } from "react";

// --- Mail Icon for the input field ---
const MailIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

export default function Newsletter(){
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you would send the 'email' state to your backend API here
    console.log(`Submitting email: ${email}`);
    // You could also add logic to show a success message
    setEmail(""); // Clear the input after submission
  };

  return (
    <div className="bg-black">
    <section className="bg-black py-20 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              See It to Believe It
            </span>
          </h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto mb-8">
            Get the latest updates, event tips, and platform news delivered
            directly to your inbox.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto"
          >
            <div className="relative flex-grow">
              <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email"
                required
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-full py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300"
              />
            </div>
            <button
              type="submit"
              className="bg-cyan-500 text-white font-bold rounded-full px-8 py-3 transition-all duration-300 ease-in-out hover:bg-cyan-600 hover:shadow-lg hover:shadow-cyan-500/20"
            >
              Get a Demo
            </button>
          </form>
        </div>
      </div>
    </section>
    </div>
  );
};
