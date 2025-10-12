import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Menu, X, LogOut, Ticket, Calendar, Users, BarChart3, QrCode, Settings, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

// Mock data and context for demonstration
const categoryMenu = {
  items: [
    {
      title: "Music",
      description: "Concerts, festivals, and live performances",
      path: "/events/music",
      icon: "🎵"
    },
    {
      title: "Sports",
      description: "Games, tournaments, and sporting events",
      path: "/events/sports",
      icon: "⚽"
    },
    {
      title: "Business",
      description: "Conferences, networking, and workshops",
      path: "/events/business",
      icon: "💼"
    }
  ]
};

// MegaMenu Component with glassmorphism
const MegaMenu = ({ menuData, isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div className="absolute top-full left-0 mt-2 w-96 backdrop-blur-2xl bg-gray-900/90 border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-slideDown">
      <div className="p-2">
        {menuData.items.map((item) => (
          <Link
            to={item.path}
            key={item.title}
            className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/20 transition-all duration-300 group"
          >
            <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
              {item.icon}
            </div>
            <div>
              <p className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                {item.title}
              </p>
              <p className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                {item.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [openMobileDropdown, setOpenMobileDropdown] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { user, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // GET ROLE-SPECIFIC DASHBOARD INFO
  const getRoleDashboard = () => {
    switch (user?.selectedRole) {
      case 'event_attendee':
        return {
          name: 'Attendee Dashboard',
          href: '/attendee-dashboard',
          icon: <User className="w-4 h-4 mr-3" />
        };
      case 'event_host':
        return {
          name: 'Organizer Dashboard',
          href: '/organizer-dashboard',
          icon: <BarChart3 className="w-4 h-4 mr-3" />
        };
      case 'event_staff':
        return {
          name: 'Staff Dashboard',
          href: '/staff-dashboard',
          icon: <Users className="w-4 h-4 mr-3" />
        };
      default:
        return null;
    }
  };

  // Role-based navigation with dynamic menu
  const getRoleBasedLinks = () => {
    const baseLinks = [
      { 
        name: "Categories", 
        dropdown: true, 
        id: "category", 
        data: categoryMenu 
      },
      { name: "All Events", href: "/allevents" },
      { name: "About", href: "#about" },
    ];

    if (isAuthenticated && user?.selectedRole) {
      switch (user.selectedRole) {
        case 'event_attendee':
          return [
            ...baseLinks,
            { name: "My Bookings", href: "/my-bookings" },
          ];
        case 'event_host':
          return [
            ...baseLinks,
            { name: "Organizer Dashboard", href: "/organizer-dashboard" },
          ];
        case 'event_staff':
          return [
            ...baseLinks,
            { name: "Staff Dashboard", href: "/staff-dashboard" },
            { name: "Assigned Events", href: "/staff/my-events" },
          ];
        default:
          return baseLinks;
      }
    }
    
    return baseLinks;
  };

  const navLinks = getRoleBasedLinks();
  const roleDashboard = getRoleDashboard();

  const renderDesktopAuthSection = () => {
    if (loading) {
      return <div className="w-24 h-8 bg-white/20 rounded-full animate-pulse backdrop-blur-sm"></div>;
    }

    if (isAuthenticated) {
      return (
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-3 p-2 rounded-full backdrop-blur-xl bg-white/15 hover:bg-white/25 border border-white/30 transition-all duration-300 group"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-cyan-400/50 transition-shadow duration-300">
              <span className="text-white font-bold text-sm">
                {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <span className="text-white hidden md:block truncate max-w-32 font-medium">
              {user?.firstName || 'User'}
            </span>
            <ChevronDown 
              className={`w-4 h-4 text-white/70 transition-all duration-300 ${
                userMenuOpen ? 'rotate-180' : ''
              }`} 
            />
          </button>

          {userMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40 lg:hidden" 
                onClick={() => setUserMenuOpen(false)}
              />
              
              <div className="absolute right-0 mt-3 w-72 backdrop-blur-2xl bg-gray-900/95 border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden animate-slideDown">
                <div className="py-2">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex items-center space-x-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white font-medium truncate">
                          {user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user?.firstName || user?.email || 'User'
                          }
                        </p>
                        <p className="text-xs text-white/60 truncate">{user?.email}</p>
                        {user?.selectedRole && (
                          <p className="text-xs text-cyan-400 mt-1 capitalize">
                            {user.selectedRole.replace('_', ' ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Role-specific Menu Items */}
                  <div className="py-1">
                    {/* Host specific options */}
                    {user?.selectedRole === 'event_host' && (
                      <>
                        <Link
                          to="/host/my-events"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center w-full px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200"
                        >
                          <Calendar className="w-4 h-4 mr-3" />
                          My Events
                        </Link>
                        <Link
                          to="/host/scanner"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center w-full px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200"
                        >
                          <QrCode className="w-4 h-4 mr-3" />
                          QR Scanner
                        </Link>
                        <div className="border-t border-white/10 my-1"></div>
                      </>
                    )}

                    {/* Profile Settings */}
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Profile Settings
                    </button>
                    
                    {/* Role Dashboard */}
                    {roleDashboard && (
                      <Link
                        to={roleDashboard.href}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center w-full px-4 py-3 text-sm text-cyan-300 hover:bg-white/10 hover:text-cyan-200 transition-all duration-200"
                      >
                        {roleDashboard.icon}
                        {roleDashboard.name}
                      </Link>
                    )}

                    <div className="border-t border-white/10 my-1"></div>

                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
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
      <div className="flex items-center gap-4 text-lg font-medium">
        <Link 
          to="/login" 
          className="text-white/90 hover:text-white px-4 py-2 rounded-full transition-all duration-300 hover:bg-white/10"
        >
          Login
        </Link>
        <Link 
          to="/register" 
          className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-6 py-2.5 rounded-full hover:shadow-lg hover:shadow-cyan-400/30 transition-all duration-300 font-semibold hover:scale-105"
        >
          Create Account
        </Link>
      </div>
    );
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'backdrop-blur-2xl bg-gray-900/70 shadow-2xl border-b border-white/20' 
          : 'backdrop-blur-xl bg-gradient-to-b from-gray-900/50 to-transparent'
      }`}>
        <div className="px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between w-full">
          <div className="flex-shrink-0">
            <Link 
              to="/" 
              className="flex items-center text-2xl font-bold group"
              onClick={() => {
                setUserMenuOpen(false);
                setIsMobileMenuOpen(false);
              }}
            >
              <span className="text-white">Tick</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 group-hover:from-blue-500 group-hover:to-cyan-400 transition-all duration-500">Mate</span>
            </Link>
          </div>

          <ul className="hidden lg:flex items-center gap-8 text-lg font-medium">
            {navLinks.map((link) => (
              <li
                key={link.name}
                className="relative"
                onMouseEnter={() => link.dropdown && setHoveredMenu(link.id)}
                onMouseLeave={() => link.dropdown && setHoveredMenu(null)}
              >
                {link.dropdown ? (
                  <button className="flex items-center gap-1.5 text-white/90 hover:text-cyan-400 transition-all duration-300 group">
                    {link.name}
                    <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                  </button>
                ) : link.href === "#about" ? (
                  <a 
                    href="#about"
                    className="text-white/90 hover:text-cyan-400 transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-cyan-400 after:to-blue-500 hover:after:w-full after:transition-all after:duration-300"
                    onClick={(e) => {
                      e.preventDefault();
                      setUserMenuOpen(false);
                      const aboutSection = document.getElementById('about');
                      if (aboutSection) {
                        aboutSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link 
                    to={link.href} 
                    className="text-white/90 hover:text-cyan-400 transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-cyan-400 after:to-blue-500 hover:after:w-full after:transition-all after:duration-300"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
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
                <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">
                    {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-lg backdrop-blur-xl bg-white/15 hover:bg-white/25 border border-white/30 transition-all duration-300"
              >
                <Menu className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-50 transform transition-transform duration-500 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="absolute inset-0 opacity-20 bg-pattern"></div>
        </div>
        
        <div className="relative flex flex-col h-full backdrop-blur-2xl bg-gray-900/80">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-2xl font-bold"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="text-white">Tick</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Mate</span>
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg backdrop-blur-xl bg-white/15 hover:bg-white/25 border border-white/30 transition-all duration-300"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {isAuthenticated && (
            <div className="p-4 bg-white/10 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-white font-bold text-lg">
                    {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white truncate">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.firstName || user?.email || 'User'
                    }
                  </p>
                  <p className="text-sm text-white/60 truncate">{user?.email}</p>
                  {user?.selectedRole && (
                    <p className="text-xs text-cyan-400 capitalize mt-1">
                      {user.selectedRole.replace('_', ' ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <ul className="flex-grow p-4 overflow-y-auto">
            {navLinks.map((link) => (
              <li key={link.name} className="border-b border-white/10">
                {link.dropdown ? (
                  <div>
                    <button
                      onClick={() => handleMobileDropdownToggle(link.id)}
                      className="w-full flex justify-between items-center py-4 text-lg font-medium text-white hover:text-cyan-400 transition-colors"
                    >
                      {link.name}
                      <ChevronDown className={`w-5 h-5 transform transition-transform duration-200 ${openMobileDropdown === link.id ? "rotate-180" : ""}`} />
                    </button>
                    {openMobileDropdown === link.id && (
                      <div className="pb-4 pl-4 space-y-2">
                        {link.data.items.map((item) => (
                          <Link 
                            to={item.path || '#'} 
                            key={item.title} 
                            className="flex items-start gap-4 p-3 rounded-xl backdrop-blur-md bg-white/10 hover:bg-white/20 transition-all duration-300"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <div className="text-2xl mt-1 flex-shrink-0">{item.icon}</div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-white">{item.title}</p>
                              <p className="text-sm text-white/60">{item.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : link.href === "#about" ? (
                  <a 
                    href="#about"
                    className="block py-4 text-lg font-medium text-white hover:text-cyan-400 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsMobileMenuOpen(false);
                      const aboutSection = document.getElementById('about');
                      if (aboutSection) {
                        aboutSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link 
                    to={link.href} 
                    className="block py-4 text-lg font-medium text-white hover:text-cyan-400 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          <div className="p-4 border-t border-white/10 space-y-3">
            {!isAuthenticated ? (
              <>
                <Link 
                  to="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-3 text-lg font-medium backdrop-blur-md bg-white/10 text-white rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-3 text-lg font-medium bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-400/30 transition-all duration-300"
                >
                  Create Account
                </Link>
              </>
            ) : (
              <>
                {roleDashboard && (
                  <Link 
                    to={roleDashboard.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center py-3 text-lg font-medium bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-400/30 transition-all duration-300"
                  >
                    {roleDashboard.name}
                  </Link>
                )}
                <button 
                  onClick={handleLogout} 
                  className="w-full text-center py-3 text-lg font-medium backdrop-blur-md bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 hover:bg-red-500/30 transition-all duration-300"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </>
  );
}