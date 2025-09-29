import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MenuIcon, XIcon, PlusIcon } from "../../helper/Icons.jsx";

const NavLink = ({ item, isActive, onClick }) => (
    <button onClick={onClick} className={`group flex items-center w-full px-4 py-3 text-left text-sm font-medium rounded-lg transition-all duration-300 ${isActive ? "bg-cyan-500/10 text-white shadow-lg shadow-cyan-500/10" : "text-gray-400 hover:bg-gray-800/50 hover:text-white"}`}>
        <item.icon className={`mr-3 h-6 w-6 transition-colors duration-300 ${isActive ? "text-cyan-400" : "text-gray-500 group-hover:text-cyan-400"}`} />
        <span className="flex-1">{item.label}</span>
        {isActive && <div className="w-1.5 h-6 bg-cyan-400 rounded-full animate-glow-light"></div>}
    </button>
);

const DashboardLayout = ({ navItems, activeSection, setActiveSection, children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="bg-black text-white min-h-screen">
            <div className="flex">
                {/* --- Desktop Sidebar --- */}
                <aside className="hidden md:flex md:flex-shrink-0">
                    <div className="flex flex-col w-64">
                        <div className="flex flex-col h-screen fixed top-0 pt-16 bg-gray-900/50 border-r border-gray-800">
                            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                                <nav className="mt-8 flex-1 px-2 space-y-2">
                                    {navItems.map((item) => <NavLink key={item.id} item={item} isActive={activeSection === item.id} onClick={() => setActiveSection(item.id)} />)}
                                </nav>
                            </div>
                        </div>
                    </div>
                </aside>

                {isMobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 flex z-40">
                        <div className="fixed inset-0 bg-black/60" onClick={() => setIsMobileMenuOpen(false)}></div>
                        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-900">
                            <div className="absolute top-0 right-0 -mr-12 pt-2">
                                <button onClick={() => setIsMobileMenuOpen(false)} className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                                    <XIcon className="h-6 w-6 text-white" />
                                </button>
                            </div>
                            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                                <div className="flex items-center flex-shrink-0 px-4">
                                    <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">EventPlatform</h1>
                                </div>
                                <nav className="mt-8 px-2 space-y-2">
                                    {navItems.map((item) => (
                                        <NavLink key={item.id} item={item} isActive={activeSection === item.id} onClick={() => { setActiveSection(item.id); setIsMobileMenuOpen(false); }} />
                                    ))}
                                </nav>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col w-0 flex-1">
                    <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                            <MenuIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <main className="flex-1 relative z-0 focus:outline-none p-4 sm:p-6 lg:p-8">
                        <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
                            <h1 className="text-3xl font-bold text-white">Organizer Dashboard</h1>
                            <button onClick={() => navigate('/newEvent')} className="w-full sm:w-auto mt-4 sm:mt-0 flex items-center justify-center bg-cyan-500 text-black font-bold rounded-full px-6 py-3 transition-all">
                                <PlusIcon className="h-6 w-6 mr-2" />
                                Create New Event
                            </button>
                        </header>
                        <div className="animate-fade-in">{children}</div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
