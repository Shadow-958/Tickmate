import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white text-center px-4">
      <h1 className="text-8xl font-extrabold text-cyan-400">404</h1>
      <h2 className="mt-4 text-4xl font-bold tracking-tight">Page Not Found</h2>
      <p className="mt-6 text-lg text-gray-400">
        Sorry, we couldn’t find the page you’re looking for.
      </p>
      <Link
        to="/"
        className="mt-10 inline-block rounded-full bg-cyan-500 px-8 py-3 text-lg font-semibold text-black transition-all duration-300 hover:bg-cyan-600 hover:scale-105"
      >
        Go back home
      </Link>
    </div>
  );
};

export default NotFoundPage;
