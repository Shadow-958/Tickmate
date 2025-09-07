import React, { useState } from "react";

// --- DATA for footer links (consistent schema) ---
const footerLinks = [
  {
    title: "Platform",
    sections: [
      {
        subtitle: null,
        links: [
          "Platform Overview",
          "Event Website Builder",
          "Event Registration & Ticketing",
          "Event Agenda Builder",
          "Analytics & Reporting",
          "Event Hub",
          "Event Marketing",
          "Attendee Networking",
          "Attendee Engagement",
          "Integrations",
        ],
      },
    ],
  },
  {
    title: "Categories",
    sections: [
      {
        subtitle: "By Event Type",
        links: [
          "Training & Workshops",
          "Fundraising",
          "Tech Meetings",
          "Open Mic Nights"
        ],
      },
      {
        subtitle: "By Event Format",
        links: ["In-Person", "Hybrid", "Virtual", "Webinar"],
      },
      {
        subtitle: "By Industry",
        links: [
          "Corporations",
          "Non-profits",
          "Associations",
          "Educational Institutions",
          "Financial Services",
        ],
      },
    ],
  },
  {
    title: "About Eventzilla",
    sections: [
      {
        subtitle: null,
        links: [
          "About",
          "Eventzilla Blog",
          "Resources",
          "Contact Us",
          "Help Desk",
        ],
      },
    ],
  },
];

// --- Chevron Icon for Accordion ---
const ChevronDownIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={3}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
    />
  </svg>
);

// --- Accordion Item for Mobile View ---
const AccordionItem = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const id = title.replace(/\s+/g, "-").toLowerCase();

  return (
    <div className="border-b border-gray-800 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left"
        aria-expanded={isOpen}
        aria-controls={id}
      >
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <ChevronDownIcon
          className={`w-5 h-5 text-gray-400 transform transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        id={id}
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? "max-h-[500px] mt-4" : "max-h-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <div className="bg-black">
    <footer className="bg-black border-t border-gray-800 text-gray-400  overflow-y-auto">
      <div className="container mx-auto px-4 py-1">
        {/* --- Desktop Footer (now a 5-column grid on large screens) --- */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Column 1: Platform */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">
              {footerLinks[0].title}
            </h3>
            <ul className="space-y-3">
              {footerLinks[0].sections[0].links.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="hover:text-cyan-500 transition-colors lg:text-sm"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {footerLinks[1].sections.map((sub) => (
            <div key={sub.subtitle}>
              <h3 className="text-lg font-medium text-white mb-4 lg:invisible">
                {footerLinks[1].title}
              </h3>{" "}
              {sub.subtitle && (
                <h4 className="text-sm font-medium text-cyan-400 uppercase tracking-wider mb-3">
                  {sub.subtitle}
                </h4>
              )}
              <ul className="space-y-3">
                {sub.links.map((link) => (
                  <li key={link}>
                    <p
                      className="hover:text-cyan-500 transition-colors lg:text-sm"
                    >
                      {link}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-lg font-medium text-white mb-4">
              {footerLinks[2].title}
            </h3>
            <ul className="space-y-3">
              {footerLinks[2].sections[0].links.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="hover:text-cyan-500 transition-colors lg:text-sm"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* --- Mobile Footer (remains the same) --- */}
        <div className="md:hidden">
          {footerLinks.map((section) => (
            <AccordionItem key={section.title} title={section.title}>
              {section.sections.map((sub) => (
                <div key={sub.subtitle || "default"} className="mb-6 pl-2">
                  {sub.subtitle && (
                    <h4 className="text-sm font-medium text-cyan-400 uppercase tracking-wider mb-3">
                      {sub.subtitle}
                    </h4>
                  )}
                  <ul className="space-y-3">
                    {sub.links.map((link) => (
                      <li key={link}>
                        <a
                          href="#"
                          className="hover:text-cyan-500 transition-colors"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </AccordionItem>
          ))}
        </div>
      </div>

      {/* --- Footer Bottom Bar --- */}
      <div className="bg-gray-900 py-4">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>&copy; {year} TapIn. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
    </div>
  );
}
