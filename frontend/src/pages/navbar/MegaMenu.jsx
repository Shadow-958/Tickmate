import React from 'react';
import { Link } from 'react-router-dom';

const MegaMenu = ({ menuData, isVisible }) => {
  const visibilityClasses = isVisible 
    ? "opacity-100 translate-y-0 visible" 
    : "opacity-0 -translate-y-4 invisible";

  return (
    <div 
      className={`absolute top-full left-0 w-full bg-gray-50 shadow-lg border-t border-gray-200 transition-all duration-300 ease-in-out ${visibilityClasses}`}
    >
      <div className="max-w-screen-xl mx-auto px-6 py-10 lg:flex lg:gap-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 flex-grow">
          {menuData.items.map((item) => (
            <Link to={item.path || "#"} key={item.title} className="flex items-start gap-4 p-2 rounded-lg hover:bg-gray-200 transition-colors">
              <div className="text-cyan-500 mt-1 flex-shrink-0">{item.icon}</div>
              <div>
                <p className="font-semibold text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {menuData.cta && (
          <div className="hidden lg:block flex-shrink-0 w-[300px] bg-cyan-50 rounded-lg p-6">
            <h3 className="font-bold text-gray-900">{menuData.cta.title}</h3>
            <p className="text-sm text-gray-600 mt-2">{menuData.cta.description}</p>
            <ul className="text-sm text-gray-600 mt-4 space-y-2">
              {menuData.cta.list.map(item => <li key={item} className="flex items-start"><span className="mr-2 mt-1">•</span>{item}</li>)}
            </ul>
            <button className="w-full mt-6 bg-cyan-500 text-white font-semibold py-2 rounded-lg hover:bg-cyan-600 transition-colors">
              {menuData.cta.buttonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MegaMenu;
