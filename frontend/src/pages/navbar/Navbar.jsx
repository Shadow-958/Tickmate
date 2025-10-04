// src/pages/navbar/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { ChevronDownIcon, HamburgerIcon, CloseIcon } from "../../helper/Icons.jsx";
import { categoryMenu } from "./menudata.jsx";
import MegaMenu from "./MegaMenu";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [openMobileDropdown, setOpenMobileDropdown] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { user, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [userMenuOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [navigate]);

  const handleMobileDropdownToggle = (dropdownName) => {
    setOpenMobileDropdown(openMobileDropdown === dropdownName ? null : dropdownName);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  // --- HARDCODED NAVIGATION LINKS ---
  const navLinks = [
    { 
      name: "Categories", 
      dropdown: true, 
      id: "category", 
      data: categoryMenu 
    },
    { name: "Events", href: "#events" },
    { name: "About", href: "#about" },
    { name: "Contact", href: "#contact" }
  ];

  const renderDesktopAuthSection = () => {
    if (loading) {
      return <div className="w-24 h-8 bg-gray-700 rounded-full animate-pulse"></div>;
    }

    if (isAuthenticated) {
      return (
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-black font-bold text-sm">
                {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <span className="text-white hidden md:block truncate max-w-32">
              {user?.firstName || 'User'}
            </span>
            <ChevronDownIcon 
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                userMenuOpen ? 'rotate-180' : ''
              }`} 
            />
          </button>

          {userMenuOpen && (
            <>
              {/* Backdrop for mobile */}
              <div 
                className="fixed inset-0 z-40 lg:hidden" 
                onClick={() => setUserMenuOpen(false)}
              />
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 transform opacity-100 scale-100 transition-all duration-200">
                <div className="py-2">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-black font-bold">
                          {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white font-medium truncate">
                          {user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user?.firstName || user?.email || 'User'
                          }
                        </p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        {user?.selectedRole && (
                          <p className="text-xs text-cyan-400 mt-1 capitalize">
                            {user.selectedRole.replace('_', ' ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        // Add profile/settings navigation here if needed
                        console.log('Profile clicked');
                        setUserMenuOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile Settings
                    </button>
                    
                    <button
                      onClick={() => {
                        // Add help/support navigation here if needed
                        console.log('Help clicked');
                        setUserMenuOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Help & Support
                    </button>

                    {/* Divider */}
                    <div className="border-t border-gray-700 my-1"></div>

                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-6 text-lg font-medium">
        <Link 
          to="/login" 
          className="hover:text-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 rounded px-2 py-1"
        >
          Login
        </Link>
        <Link 
          to="/register" 
          className="border border-cyan-400 text-cyan-400 px-5 py-2 rounded-full hover:bg-cyan-400 hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50"
        >
          Create Account
        </Link>
      </div>
    );
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-gray-200 px-4 sm:px-10 py-4 flex items-center justify-between font-sans shadow-lg">
        <Link 
          to="/" 
          className="flex-shrink-0 flex items-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 rounded"
          onClick={() => {
            setUserMenuOpen(false);
            setIsMobileMenuOpen(false);
          }}
        >
          Tick<span className="text-cyan-400">Mate</span>
        </Link>

        <ul className="hidden lg:flex items-center gap-7 text-lg font-medium">
          {navLinks.map((link) => (
            <li
              key={link.name}
              className="static"
              onMouseEnter={() => link.dropdown && setHoveredMenu(link.id)}
              onMouseLeave={() => link.dropdown && setHoveredMenu(null)}
            >
              {link.dropdown ? (
                <button className="flex items-center gap-1.5 text-gray-200 hover:text-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 rounded px-2 py-1">
                  {link.name}
                  <ChevronDownIcon />
                </button>
              ) : (
                <a 
                  href={link.href} 
                  className="hover:text-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 rounded px-2 py-1"
                  onClick={() => setUserMenuOpen(false)}
                >
                  {link.name}
                </a>
              )}
              {link.dropdown && <MegaMenu menuData={link.data} isVisible={hoveredMenu === link.id} />}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex">
            {renderDesktopAuthSection()}
          </div>
          <div className="lg:hidden flex items-center gap-4">
            {isAuthenticated && (
              <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-sm">
                  {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 rounded p-1"
            >
              <HamburgerIcon />
            </button>
          </div>
        </div>
      </nav>

      {/* --- MOBILE MENU --- */}
      <div
        className={`fixed top-0 right-0 w-full h-full bg-gray-50 text-black z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-2xl font-bold text-black"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Tick<span className="text-cyan-400">Mate</span>
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 rounded p-1"
            >
              <CloseIcon />
            </button>
          </div>

          {/* User Info Section (Mobile) */}
          {isAuthenticated && (
            <div className="p-4 bg-gray-100 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-black font-bold">
                    {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.firstName || user?.email || 'User'
                    }
                  </p>
                  <p className="text-sm text-gray-600 truncate">{user?.email}</p>
                  {user?.selectedRole && (
                    <p className="text-xs text-cyan-600 capitalize">
                      {user.selectedRole.replace('_', ' ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <ul className="flex-grow p-4 overflow-y-auto">
            {navLinks.map((link) => (
              <li key={link.name} className="border-b">
                {link.dropdown ? (
                  <div>
                    <button
                      onClick={() => handleMobileDropdownToggle(link.id)}
                      className="w-full flex justify-between items-center py-4 text-lg font-medium focus:outline-none"
                    >
                      {link.name}
                      <span className={`transform transition-transform duration-200 ${openMobileDropdown === link.id ? "rotate-180" : "rotate-0"}`}>
                        <ChevronDownIcon />
                      </span>
                    </button>
                    {openMobileDropdown === link.id && (
                      <div className="pb-4 pl-4 space-y-4">
                        {link.data.items.map((item) => (
                          <Link 
                            to={item.path || '#'} 
                            key={item.title} 
                            className="flex items-start gap-4 p-2 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <div className="text-cyan-500 mt-1 flex-shrink-0">{item.icon}</div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900">{item.title}</p>
                              <p className="text-sm text-gray-500">{item.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <a 
                    href={link.href} 
                    className="block py-4 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 rounded"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                )}
              </li>
            ))}
          </ul>

          {/* Auth Section (Mobile) */}
          <div className="p-4 border-t flex flex-col gap-4">
            {!isAuthenticated ? (
              <>
                <Link 
                  to="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-3 text-lg font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-3 text-lg font-medium bg-cyan-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50"
                >
                  Create Account
                </Link>
              </>
            ) : (
              <button 
                onClick={handleLogout} 
                className="w-full text-center py-3 text-lg font-medium border border-red-300 text-red-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
