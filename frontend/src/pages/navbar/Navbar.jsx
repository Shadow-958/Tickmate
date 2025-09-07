import React, { useState } from "react";
import { ChevronDownIcon, HamburgerIcon, CloseIcon } from "../../helper/Icons.jsx";
import { featuresMenu, categoryMenu } from "./menudata.jsx";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import MegaMenu from "./MegaMenu";
import { useNavigate } from "react-router-dom";
import { useAppUser } from "../../hooks/useAppUser.js";
import { LayoutDashboard, TicketPlus } from "lucide-react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [openMobileDropdown, setOpenMobileDropdown] = useState(null);
  
  const { isSignedIn, isLoaded } = useUser(); 
  const { user: appUser, isLoading: isAppUserLoading } = useAppUser(); 
  
  const navigate = useNavigate();
  const { openSignIn, openSignUp, signOut } = useClerk();

  const handleMobileDropdownToggle = (dropdownName) => {
    setOpenMobileDropdown(openMobileDropdown === dropdownName ? null : dropdownName);
  };

  // --- DYNAMICALLY BUILD NAVIGATION LINKS ---
  const navLinks = [
    { name: "Features", dropdown: true, id: "features", data: featuresMenu },
    { name: "Category", dropdown: true, id: "category", data: categoryMenu },
  ];

  if (isSignedIn && !isAppUserLoading) {
    if (appUser?.role === 'organizer') {
      navLinks.push({ name: "MyEvents", onClick: () => navigate("/organizer-dashboard") });
    } else if (appUser?.role === 'attendee') {
      navLinks.push({ name: "MyTickets", onClick: () => navigate("/my-bookings") });
    }
  }

  navLinks.push({ name: "Why Tapin", href: "#" });
  
  const handleOrganizerSignUp = () => {
    openSignUp({ afterSignUpUrl: '/onboarding' });
  };

  const handleLogin = () => {
    openSignIn({ afterSignInUrl: '/auth-callback' });
  };

  const renderDesktopAuthSection = () => {
    if (!isLoaded) {
      return <div className="w-24 h-8 bg-gray-700 rounded-full animate-pulse"></div>;
    }

    if (isSignedIn) {
      return (
        <UserButton afterSignOutUrl="/">
          <UserButton.MenuItems>
            {isAppUserLoading ? (
              <UserButton.Action label="Loading..." disabled />
            ) : appUser?.role === 'organizer' ? (
              <UserButton.Action
                label="MyEvents"
                labelIcon={<LayoutDashboard width={15} />}
                onClick={() => navigate("/organizer-dashboard")}
              />
            ) : (
              <UserButton.Action
                label="My Bookings"
                labelIcon={<TicketPlus width={15} />}
                onClick={() => navigate("/my-bookings")}
              />
            )}
          </UserButton.MenuItems>
        </UserButton>
      );
    }

    return (
      <div className="flex items-center gap-6 text-lg font-medium">
        <button onClick={handleLogin} className="hover:text-cyan-400 transition-colors">
          Login
        </button>
        <button onClick={handleOrganizerSignUp} className="border border-cyan-400 text-cyan-400 px-5 py-2 rounded-full hover:bg-cyan-400 hover:text-black transition-colors">
          Create your account
        </button>
      </div>
    );
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-gray-200 px-4 sm:px-10 py-4 flex items-center justify-between font-sans">
        <a href="/" className="flex-shrink-0 flex items-center  text-2xl font-bold">
          Stage<span className="text-cyan-400">pass</span>
        </a>

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
                {isLoaded && isSignedIn && <UserButton afterSignOutUrl="/" />}
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
            <a href="/" className="flex items-center gap-2 text-2xl font-bold text-black">
              Stage<span className="text-cyan-400">pass</span>
            </a>
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
                           <a href={item.path || '#'} key={item.title} className="flex items-start gap-4 p-2 rounded-lg hover:bg-gray-200">
                             <div className="text-cyan-500 mt-1 flex-shrink-0">{item.icon}</div>
                             <div>
                               <p className="font-semibold text-gray-900">{item.title}</p>
                               <p className="text-sm text-gray-500">{item.description}</p>
                             </div>
                           </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : link.onClick ? (
                  <button onClick={() => { link.onClick(); setIsMobileMenuOpen(false); }} className="block py-4 text-lg font-medium w-full text-left">
                    {link.name}
                  </button>
                ) : (
                  <a href={link.href} className="block py-4 text-lg font-medium">{link.name}</a>
                )}
              </li>
            ))}
          </ul>
          
          <div className="p-4 border-t flex flex-col gap-4">
            {!isSignedIn ? (
              <>
                <button onClick={() => { handleLogin(); setIsMobileMenuOpen(false); }} className="w-full text-center py-3 text-lg font-medium border border-gray-300 rounded-lg">
                  Login
                </button>
                <button onClick={() => { handleOrganizerSignUp(); setIsMobileMenuOpen(false); }} className="w-full text-center py-3 text-lg font-medium bg-cyan-400 text-white rounded-lg">
                  Create your account
                </button>
              </>
            ) : (
              <>
                {appUser?.role === 'organizer' ? (
                  <button onClick={() => { navigate('/organizer-dashboard'); setIsMobileMenuOpen(false); }} className="w-full text-center py-3 text-lg font-medium bg-cyan-400 text-white rounded-lg">
                    Organizer Dashboard
                  </button>
                ) : (
                  <button onClick={() => { navigate('/my-bookings'); setIsMobileMenuOpen(false); }} className="w-full text-center py-3 text-lg font-medium bg-cyan-400 text-white rounded-lg">
                    My Bookings
                  </button>
                )}
                <button onClick={() => signOut(() => navigate('/'))} className="w-full text-center py-3 text-lg font-medium border border-gray-300 rounded-lg">
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

