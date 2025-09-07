import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { ExclamationIcon, SparklesIcon, UploadIcon } from "../../helper/Icons.jsx";

const FormInput = ({ id, label, type, placeholder, value, onChange, required = false, children, disabled = false, error }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
    <div className="relative">
      {children || (
        <input
          type={type}
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full bg-gray-900/50 border text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 transition-all duration-300 ${
            error ? "border-red-500 ring-red-500/50" : "border-gray-700 focus:ring-cyan-500"
          }`}
        />
      )}
    </div>
    {error && (
      <p className="mt-2 text-sm text-red-500 flex items-center">
        <ExclamationIcon className="h-4 w-4 mr-2" />
        {error}
      </p>
    )}
  </div>
);

const EventForm = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ title: "", description: "", category: "", location: "", startDateTime: "", endDateTime: "", isFree: false, price: "", capacity: "" });
  const [bannerImage, setBannerImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Event title is required.";
    if (!formData.description.trim()) newErrors.description = "Description is required.";
    if (!formData.category) newErrors.category = "Please select a category.";
    if (!formData.location.trim()) newErrors.location = "Location is required.";
    if (!formData.startDateTime) newErrors.startDateTime = "Start date is required.";
    if (!formData.endDateTime) newErrors.endDateTime = "End date is required.";
    if (formData.startDateTime && formData.endDateTime && new Date(formData.endDateTime) <= new Date(formData.startDateTime)) {
      newErrors.endDateTime = "End date must be after the start date.";
    }
    if (!formData.isFree && !formData.price) newErrors.price = "Price is required for paid events.";
    if (!formData.capacity) newErrors.capacity = "Capacity is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerateDescription = async () => {
    if (!formData.title || !formData.category) {
      setErrors((prev) => ({ ...prev, description: "Please fill in the Event Title and Category first." }));
      return;
    }
    setIsGenerating(true);
    setErrors({});
    const prompt = `You are a professional event marketer. Write a compelling and exciting event description for an event with the title "${formData.title}" in the "${formData.category}" category. The description should be around 3-4 sentences, highlighting the key benefits for attendees and creating a sense of excitement. Do not use placeholders like "[Event Name]"`;
    try {
      const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key for Gemini is not configured.");
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      const response = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`API error: ${response.statusText}`);
      const result = await response.json();
      const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generatedText) {
        setFormData((prev) => ({ ...prev, description: generatedText }));
      } else {
        throw new Error("Failed to get a valid response from the API.");
      }
    } catch (err) {
      console.error("Error generating description:", err);
      setErrors((prev) => ({ ...prev, description: "Couldn't generate a description. Please try again." }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!user) {
      setSubmitError("You must be logged in to create an event.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    const submissionData = new FormData();
    submissionData.append('title', formData.title);
    submissionData.append('description', formData.description);
    submissionData.append('category', formData.category);
    submissionData.append('location', formData.location);
    submissionData.append('startDateTime', formData.startDateTime);
    submissionData.append('endDateTime', formData.endDateTime);
    submissionData.append('capacity', formData.capacity);
    submissionData.append('clerkId', user.id);
    const pricingData = { isFree: formData.isFree, price: formData.isFree ? 0 : formData.price * 100 };
    submissionData.append('pricing', JSON.stringify(pricingData));
    if (bannerImage) {
      submissionData.append('bannerImage', bannerImage);
    }
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/events`,
        { method: "POST", body: submissionData }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create the event. Please check server logs.' }));
        throw new Error(errorData.message);
      }
      const newEvent = await response.json();
      navigate(`/create-success`, { state: { newEvent } });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-black min-h-screen p-4 sm:p-6 lg:p-8">
      <style>{`input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(1); }`}</style>
      <div className="relative container mx-auto max-w-4xl">
        <div className="absolute -top-16 -left-24 w-64 h-64 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-16 -right-24 w-64 h-64 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full filter blur-3xl opacity-30 animate-pulse animation-delay-4000"></div>
        <div className="relative p-0.5 bg-gradient-to-br from-cyan-500/50 via-transparent to-blue-500/50 rounded-2xl">
          <div className="relative backdrop-blur-xl bg-gradient-to-br from-gray-900/80 to-black/80 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
            <div className="p-8 sm:p-12">
              <header className="text-center mb-10">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight"><span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">Create New Event</span></h1>
                <p className="mt-4 text-lg text-gray-400">Fill in the details to get your event live.</p>
              </header>
              <form onSubmit={handleSubmit} className="space-y-8" noValidate>
                <FormInput id="title" label="Event Title" type="text" placeholder="e.g., Annual Tech Summit 2025" value={formData.title} onChange={handleChange} error={errors.title} />
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
                    <button type="button" onClick={handleGenerateDescription} disabled={isGenerating} className="group flex items-center text-xs font-semibold text-cyan-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      <SparklesIcon className="h-4 w-4 mr-1" />
                      {isGenerating ? "Generating..." : "Auto-generate with AI"}
                    </button>
                  </div>
                  <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Tell us more about your event..." className={`w-full bg-gray-900/50 border text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 transition-all duration-300 ${errors.description ? "border-red-500 ring-red-500/50" : "border-gray-700 focus:ring-cyan-500"}`}></textarea>
                  {errors.description && (<p className="mt-2 text-sm text-red-500 flex items-center"><ExclamationIcon className="h-4 w-4 mr-2" />{errors.description}</p>)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Banner Image</label>
                  <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-700 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {imagePreview ? (<img src={imagePreview} alt="Banner preview" className="mx-auto h-48 w-auto rounded-lg object-cover" />) : (<UploadIcon className="mx-auto h-12 w-12 text-gray-500" />)}
                      <div className="flex text-sm text-gray-400">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-cyan-400 hover:text-cyan-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-cyan-500 px-2">
                          <span>Upload a file</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormInput id="category" label="Category" error={errors.category}>
                    <select id="category" name="category" value={formData.category} onChange={handleChange} className={`w-full bg-gray-900/50 border text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 transition-all duration-300 ${errors.category ? "border-red-500 ring-red-500/50" : "border-gray-700 focus:ring-cyan-500"}`}>
                      <option value="" disabled>Select a category</option>
                      <option value="tech-meetups">Tech Meetups</option>
                      <option value="workshops-training">Workshops & Training</option>
                      <option value="open-mic-comedy">Open Mic & Comedy</option>
                      <option value="fitness-bootcamp">Fitness & Bootcamp</option>
                    </select>
                  </FormInput>
                  <FormInput id="location" label="Location" type="text" placeholder="e.g., Innovation Hub, Bangalore" value={formData.location} onChange={handleChange} error={errors.location} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormInput id="startDateTime" label="Start Date & Time" type="datetime-local" value={formData.startDateTime} onChange={handleChange} error={errors.startDateTime} />
                  <FormInput id="endDateTime" label="End Date & Time" type="datetime-local" value={formData.endDateTime} onChange={handleChange} error={errors.endDateTime} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div className="flex items-center space-x-4">
                    <FormInput id="price" label="Price (₹)" type="number" placeholder="500" value={formData.price} onChange={handleChange} disabled={formData.isFree} error={errors.price} />
                    <div className="flex items-center h-12 mt-8">
                      <input type="checkbox" id="isFree" name="isFree" checked={formData.isFree} onChange={handleChange} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-600" />
                      <label htmlFor="isFree" className="ml-2 text-sm font-medium text-gray-300">Is it Free?</label>
                    </div>
                  </div>
                  <FormInput id="capacity" label="Capacity" type="number" placeholder="e.g., 150" value={formData.capacity} onChange={handleChange} error={errors.capacity} />
                </div>
                <div className="pt-6">
                  <button type="submit" disabled={isSubmitting} className="w-full bg-cyan-500 text-black font-bold rounded-full px-8 py-4 text-lg transition-all duration-300 ease-in-out hover:bg-cyan-600 hover:shadow-lg hover:shadow-cyan-500/30 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? 'Creating Event...' : 'Add This Event'}
                  </button>
                  {submitError && <p className="mt-4 text-center text-red-500">{submitError}</p>}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventForm;
