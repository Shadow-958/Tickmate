// src/pages/navbar/Navbar.jsx
import React, { useState } from "react";
import { ChevronDownIcon, HamburgerIcon, CloseIcon } from "../../helper/Icons.jsx";
import { featuresMenu, categoryMenu } from "./menudata.jsx";
import MegaMenu from "./MegaMenu";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { LayoutDashboard, TicketPlus, LogOut } from "lucide-react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [openMobileDropdown, setOpenMobileDropdown] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { user, isAuthenticated, loading, logout, isHost, isAttendee } = useAuth();
  const navigate = useNavigate();

  const handleMobileDropdownToggle = (dropdownName) => {
    setOpenMobileDropdown(openMobileDropdown === dropdownName ? null : dropdownName);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  // --- DYNAMICALLY BUILD NAVIGATION LINKS ---
  const navLinks = [
    { name: "Features", dropdown: true, id: "features", data: featuresMenu },
    { name: "Category", dropdown: true, id: "category", data: categoryMenu },
  ];

  if (isAuthenticated && !loading) {
    if (isHost) {
      navLinks.push({ name: "MyEvents", onClick: () => navigate("/organizer-dashboard") });
    } else if (isAttendee) {
      navLinks.push({ name: "MyTickets", onClick: () => navigate("/my-bookings") });
    }
  }

  navLinks.push({ name: "Why Tickmate", href: "#" });

  const renderDesktopAuthSection = () => {
    if (loading) {
      return <div className="w-24 h-8 bg-gray-700 rounded-full animate-pulse"></div>;
    }

    if (isAuthenticated) {
      return (
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-sm">
                {user?.firstName?.charAt(0) || 'U'}
              </span>
            </div>
            <span className="text-white hidden md:block">{user?.firstName}</span>
            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
              <div className="py-1">
                <div className="px-4 py-2 border-b border-gray-700">
                  <p className="text-sm text-white font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>

                {isHost ? (
                  <button
                    onClick={() => { navigate("/organizer-dashboard"); setUserMenuOpen(false); }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Host Dashboard
                  </button>
                ) : (
                  <button
                    onClick={() => { navigate("/my-bookings"); setUserMenuOpen(false); }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  >
                    <TicketPlus className="w-4 h-4 mr-2" />
                    My Bookings
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-6 text-lg font-medium">
        <Link to="/login" className="hover:text-cyan-400 transition-colors">
          Login
        </Link>
        <Link 
          to="/register" 
          className="border border-cyan-400 text-cyan-400 px-5 py-2 rounded-full hover:bg-cyan-400 hover:text-black transition-colors"
        >
          Create your account
        </Link>
      </div>
    );
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-gray-200 px-4 sm:px-10 py-4 flex items-center justify-between font-sans">
        <Link to="/" className="flex-shrink-0 flex items-center text-2xl font-bold">
          Tick<span className="text-cyan-400">mate</span>
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
                <button className="flex items-center gap-1.5 text-gray-200 hover:text-cyan-400 transition-colors">
                  {link.name}
                  <ChevronDownIcon />
                </button>
              ) : link.onClick ? (
                <button onClick={link.onClick} className="hover:text-cyan-400 transition-colors">
                  {link.name}
                </button>
              ) : (
                <a href={link.href} className="hover:text-cyan-400 transition-colors">
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
                  {user?.firstName?.charAt(0) || 'U'}
                </span>
              </div>
            )}
            <button onClick={() => setIsMobileMenuOpen(true)}>
              <HamburgerIcon />
            </button>
          </div>
        </div>
      </nav>

      {/* --- COMPLETE MOBILE MENU --- */}
      <div
        className={`fixed top-0 right-0 w-full h-full bg-gray-50 text-black z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-black">
              Tap<span className="text-cyan-400">In</span>
            </Link>
            <button onClick={() => setIsMobileMenuOpen(false)}>
              <CloseIcon />
            </button>
          </div>

          <ul className="flex-grow p-4 overflow-y-auto">
            {navLinks.map((link) => (
              <li key={link.name} className="border-b">
                {link.dropdown ? (
                  <div>
                    <button
                      onClick={() => handleMobileDropdownToggle(link.id)}
                      className="w-full flex justify-between items-center py-4 text-lg font-medium"
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
                            className="flex items-start gap-4 p-2 rounded-lg hover:bg-gray-200"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <div className="text-cyan-500 mt-1 flex-shrink-0">{item.icon}</div>
                            <div>
                              <p className="font-semibold text-gray-900">{item.title}</p>
                              <p className="text-sm text-gray-500">{item.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : link.onClick ? (
                  <button 
                    onClick={() => { link.onClick(); setIsMobileMenuOpen(false); }} 
                    className="block py-4 text-lg font-medium w-full text-left"
                  >
                    {link.name}
                  </button>
                ) : (
                  <a href={link.href} className="block py-4 text-lg font-medium">{link.name}</a>
                )}
              </li>
            ))}
          </ul>

          <div className="p-4 border-t flex flex-col gap-4">
            {!isAuthenticated ? (
              <>
                <Link 
                  to="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-3 text-lg font-medium border border-gray-300 rounded-lg"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-3 text-lg font-medium bg-cyan-400 text-white rounded-lg"
                >
                  Create your account
                </Link>
              </>
            ) : (
              <>
                {isHost ? (
                  <button 
                    onClick={() => { navigate('/organizer-dashboard'); setIsMobileMenuOpen(false); }} 
                    className="w-full text-center py-3 text-lg font-medium bg-cyan-400 text-white rounded-lg"
                  >
                    Host Dashboard
                  </button>
                ) : (
                  <button 
                    onClick={() => { navigate('/my-bookings'); setIsMobileMenuOpen(false); }} 
                    className="w-full text-center py-3 text-lg font-medium bg-cyan-400 text-white rounded-lg"
                  >
                    My Bookings
                  </button>
                )}
                <button 
                  onClick={handleLogout} 
                  className="w-full text-center py-3 text-lg font-medium border border-red-300 text-red-600 rounded-lg"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}