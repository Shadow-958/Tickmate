import React from "react";
import { TicketIcon, QRIcon, PaymentIcon, DashboardIcon } from "../../helper/Icons";

const facilities = [
  {
    icon: TicketIcon,
    title: "Effortless Event Creation",
    description:
      "Create and publish your event page in minutes. Add details, upload posters, and set ticket prices with a few simple clicks.",
  },
  {
    icon: QRIcon,
    title: "Digital QR Code Tickets",
    description:
      "Attendees receive a unique QR code ticket via email, ensuring secure and seamless check-ins at the venue.",
  },
  {
    icon: PaymentIcon,
    title: "Secure Payment Gateway",
    description:
      "Integrate with Stripe or PayPal for hassle-free, secure online ticket sales. Both free and paid events are supported.",
  },
  {
    icon: DashboardIcon,
    title: "Organizer Dashboard",
    description:
      "Manage attendees, track ticket sales in real-time, and get valuable insights to make your event a success.",
  },
];

const FacilityCard = ({ icon: Icon, title, description }) => {
  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 blur transition duration-500 group-hover:opacity-75"></div>
      <div className="relative flex h-full flex-col items-start rounded-2xl bg-gradient-to-b from-gray-900 to-black p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-800 border border-gray-700">
          {Icon && <Icon className="h-6 w-6 text-cyan-400" />}
        </div>
        <h3 className="mt-6 text-xl font-bold text-white">{title}</h3>
        <p className="mt-4 text-base text-gray-400">{description}</p>
      </div>
    </div>
  );
};

const FacilitiesSection = () => {
  return (
    <section className="bg-transparent text-white py-20 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              Why Choose Our Platform?
            </span>
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
            Everything you need to host successful micro-events without the
            complexity.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {facilities.map((facility, index) => (
            <FacilityCard
              key={index}
              icon={facility.icon}
              title={facility.title}
              description={facility.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default function Facilities() {
  return (
    <div className="bg-black">
      <FacilitiesSection />
    </div>
  );
}
