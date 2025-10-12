// src/components/navbar/MegaMenu.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const MegaMenu = ({ menuData, isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 30,
            mass: 0.8
          }}
          className="absolute top-full left-0 mt-2 w-full min-w-[600px] lg:w-[900px] -translate-x-1/4 z-50"
        >
          {/* Backdrop blur container */}
          <div className="relative">
            {/* Animated glow border */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 via-blue-500/20 to-purple-500/30 rounded-3xl blur-lg opacity-60"></div>
            
            {/* Main glassmorphic container */}
            <div className="relative backdrop-blur-2xl bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/98 rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
              
              {/* Animated background particles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl"
                />
                <motion.div
                  animate={{
                    scale: [1.2, 1, 1.2],
                    rotate: [360, 180, 0],
                  }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-gradient-to-tr from-purple-500/5 to-pink-500/5 rounded-full blur-3xl"
                />
              </div>

              {/* Content container */}
              <div className="relative px-8 py-10">
                {/* Header section */}
                <div className="mb-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-2 text-cyan-400 mb-2"
                  >
                    <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full"></div>
                    <span className="text-sm font-semibold uppercase tracking-wider">
                      {menuData.title || 'Menu'}
                    </span>
                  </motion.div>
                </div>

                {/* Grid layout for menu items */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                  {menuData.items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 + 0.15 }}
                    >
                      <Link 
                        to={item.path || "#"} 
                        className="group relative block p-4 rounded-xl transition-all duration-300 hover:transform hover:scale-[1.02]"
                      >
                        {/* Hover background effect */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/0 to-white/0 group-hover:from-cyan-400/8 group-hover:to-blue-500/8 transition-all duration-300"></div>
                        <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-white/10 transition-all duration-300"></div>
                        
                        {/* Content */}
                        <div className="relative flex items-start gap-4">
                          {/* Icon container with animated gradient */}
                          <motion.div 
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/15 to-blue-500/15 group-hover:from-cyan-400/25 group-hover:to-blue-500/25 transition-all duration-300"
                          >
                            <div className="text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300">
                              {item.icon}
                            </div>
                          </motion.div>
                          
                          {/* Text content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white group-hover:text-cyan-300 transition-colors duration-300 mb-2">
                              {item.title}
                            </h3>
                            <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300 leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          {/* Animated arrow */}
                          <motion.div 
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
                            initial={{ x: -10 }}
                            whileHover={{ x: 0 }}
                          >
                            <svg className="w-5 h-5 text-cyan-400 mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </motion.div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Section */}
                {menuData.cta && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative p-6 rounded-xl bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 backdrop-blur-sm border border-white/10 overflow-hidden"
                  >
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-transparent"></div>
                      <svg className="absolute right-0 top-0 w-32 h-32 text-cyan-400/10" fill="currentColor">
                        <circle cx="64" cy="64" r="64"/>
                      </svg>
                    </div>

                    <div className="relative flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-white mb-3 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                          {menuData.cta.title}
                        </h3>
                        <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                          {menuData.cta.description}
                        </p>
                        
                        {menuData.cta.list && (
                          <ul className="text-sm text-gray-400 space-y-2">
                            {menuData.cta.list.map((item, index) => (
                              <motion.li 
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + index * 0.1 }}
                                className="flex items-start group cursor-pointer"
                              >
                                <span className="text-cyan-400 mr-3 mt-0.5 group-hover:text-cyan-300 transition-colors">✦</span>
                                <span className="group-hover:text-gray-300 transition-colors">{item}</span>
                              </motion.li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {menuData.cta.buttonText && (
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold rounded-xl hover:shadow-xl hover:shadow-cyan-400/25 transition-all duration-300 relative overflow-hidden"
                        >
                          {/* Button glow effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 to-blue-400 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                          <span className="relative z-10">{menuData.cta.buttonText}</span>
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MegaMenu;
