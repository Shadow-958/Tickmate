import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ExclamationIcon, SparklesIcon, UploadIcon } from "../../helper/Icons.jsx";
import apiClient from "../../utils/apiClient";
import toast from 'react-hot-toast';

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
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ 
    title: "", 
    description: "", 
    category: "", 
    location: {
      venue: "",
      address: "",
      city: ""
    }, 
    startDateTime: "", 
    endDateTime: "", 
    isFree: false, 
    price: "", 
    capacity: "" 
  });
  const [bannerImage, setBannerImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState({});

  // Check authentication on component mount
  useEffect(() => {
    if (!user || !apiClient.isAuthenticated()) {
      toast.error('Please log in to create an event');
      navigate('/login');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData((prev) => ({ 
        ...prev, 
        [name]: type === "checkbox" ? checked : value 
      }));
    }

    // Clear specific error when user starts typing
    if (errors[name] || errors[name?.split('.')[1]]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
        [name?.split('.')[1]]: undefined
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, bannerImage: "File size must be less than 10MB" }));
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, bannerImage: "Please select a valid image file" }));
        return;
      }

      setBannerImage(file);
      setImagePreview(URL.createObjectURL(file));
      
      // Clear any existing error
      setErrors(prev => ({ ...prev, bannerImage: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const now = new Date();

    // Basic validations
    if (!formData.title.trim()) newErrors.title = "Event title is required.";
    if (!formData.description.trim()) newErrors.description = "Description is required.";
    if (!formData.category) newErrors.category = "Please select a category.";
    if (!formData.location.venue.trim()) newErrors.venue = "Venue is required.";
    if (!formData.location.address.trim()) newErrors.address = "Address is required.";
    if (!formData.location.city.trim()) newErrors.city = "City is required.";
    if (!formData.startDateTime) newErrors.startDateTime = "Start date is required.";
    if (!formData.endDateTime) newErrors.endDateTime = "End date is required.";
    if (!formData.capacity) newErrors.capacity = "Capacity is required.";

    // Date validations
    if (formData.startDateTime && new Date(formData.startDateTime) <= now) {
      newErrors.startDateTime = "Start date must be in the future.";
    }

    if (formData.startDateTime && formData.endDateTime) {
      const startDate = new Date(formData.startDateTime);
      const endDate = new Date(formData.endDateTime);
      
      if (endDate <= startDate) {
        newErrors.endDateTime = "End date must be after the start date.";
      }
      
      // Minimum duration check (30 minutes)
      const duration = endDate - startDate;
      if (duration < 30 * 60 * 1000) {
        newErrors.endDateTime = "Event must be at least 30 minutes long.";
      }
    }

    // Price validation
    if (!formData.isFree && (!formData.price || parseFloat(formData.price) <= 0)) {
      newErrors.price = "Price is required for paid events and must be greater than 0.";
    }

    // Capacity validation
    if (formData.capacity && (parseInt(formData.capacity) <= 0 || parseInt(formData.capacity) > 10000)) {
      newErrors.capacity = "Capacity must be between 1 and 10,000.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerateDescription = async () => {
    if (!formData.title || !formData.category) {
      setErrors((prev) => ({ ...prev, description: "Please fill in the Event Title and Category first." }));
      return;
    }
    
    setIsGenerating(true);
    setErrors(prev => ({ ...prev, description: undefined }));

    try {
      // Replace this with actual AI API call when available
      const descriptions = [
        `Join us for an exciting ${formData.title} event! This ${formData.category.replace('-', ' ')} gathering will bring together enthusiasts and professionals for an unforgettable experience. Don't miss this opportunity to learn, network, and be inspired.`,
        `Experience the best of ${formData.category.replace('-', ' ')} at ${formData.title}. Connect with like-minded individuals, discover new opportunities, and immerse yourself in an engaging environment designed to educate and entertain.`,
        `${formData.title} is your gateway to the world of ${formData.category.replace('-', ' ')}. Whether you're a beginner or an expert, this event offers something valuable for everyone. Join us for insights, inspiration, and meaningful connections.`
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
      setFormData((prev) => ({ ...prev, description: randomDescription }));
      toast.success('Description generated successfully!');
    } catch (error) {
      setErrors((prev) => ({ ...prev, description: "Failed to generate description. Please try again." }));
      toast.error('Failed to generate description');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    if (!user || !apiClient.isAuthenticated()) {
      setSubmitError("You must be logged in to create an event.");
      toast.error("Authentication required");
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        location: {
          venue: formData.location.venue.trim(),
          address: formData.location.address.trim(),
          city: formData.location.city.trim()
        },
        startDateTime: formData.startDateTime,
        endDateTime: formData.endDateTime,
        capacity: parseInt(formData.capacity),
        pricing: {
          isFree: formData.isFree,
          price: formData.isFree ? 0 : parseFloat(formData.price) || 0
        }
      };

      let response;

      if (bannerImage) {
        // For file upload, use FormData
        const formDataToSend = new FormData();
        
        // Append event data
        Object.keys(eventData).forEach(key => {
          if (typeof eventData[key] === 'object') {
            formDataToSend.append(key, JSON.stringify(eventData[key]));
          } else {
            formDataToSend.append(key, eventData[key]);
          }
        });
        
        formDataToSend.append('bannerImage', bannerImage);
        response = await apiClient.post('/api/host/events', formDataToSend);
      } else {
        response = await apiClient.post('/api/host/events', eventData);
      }

      toast.success('Event created successfully!');
      
      // Navigate to organizer dashboard
      navigate('/organizer-dashboard');
      
    } catch (error) {
      const errorMessage = error.message || 'Failed to create event. Please try again.';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
      console.error('Event creation failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup image preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

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
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                  <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">Create New Event</span>
                </h1>
                <p className="mt-4 text-lg text-gray-400">Fill in the details to get your event live.</p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-8" noValidate>
                <FormInput 
                  id="title" 
                  label="Event Title" 
                  type="text" 
                  placeholder="e.g., Annual Tech Summit 2025" 
                  value={formData.title} 
                  onChange={handleChange} 
                  error={errors.title} 
                />

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
                    <button 
                      type="button" 
                      onClick={handleGenerateDescription} 
                      disabled={isGenerating || !formData.title || !formData.category} 
                      className="group flex items-center text-xs font-semibold text-cyan-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <SparklesIcon className="h-4 w-4 mr-1" />
                      {isGenerating ? "Generating..." : "Auto-generate with AI"}
                    </button>
                  </div>
                  <textarea 
                    id="description" 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    rows="4" 
                    placeholder="Tell us more about your event..." 
                    className={`w-full bg-gray-900/50 border text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 transition-all duration-300 resize-vertical ${
                      errors.description ? "border-red-500 ring-red-500/50" : "border-gray-700 focus:ring-cyan-500"
                    }`}
                  ></textarea>
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                      <ExclamationIcon className="h-4 w-4 mr-2" />
                      {errors.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Banner Image</label>
                  <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-700 border-dashed rounded-md hover:border-gray-600 transition-colors">
                    <div className="space-y-1 text-center">
                      {imagePreview ? (
                        <div className="relative">
                          <img src={imagePreview} alt="Banner preview" className="mx-auto h-48 w-auto rounded-lg object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setBannerImage(null);
                              setImagePreview("");
                              setErrors(prev => ({ ...prev, bannerImage: undefined }));
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                      )}
                      <div className="flex text-sm text-gray-400">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-cyan-400 hover:text-cyan-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-cyan-500 px-2">
                          <span>{imagePreview ? 'Change image' : 'Upload a file'}</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                  {errors.bannerImage && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                      <ExclamationIcon className="h-4 w-4 mr-2" />
                      {errors.bannerImage}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormInput id="category" label="Category" error={errors.category}>
                    <select 
                      id="category" 
                      name="category" 
                      value={formData.category} 
                      onChange={handleChange} 
                      className={`w-full bg-gray-900/50 border text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 transition-all duration-300 ${
                        errors.category ? "border-red-500 ring-red-500/50" : "border-gray-700 focus:ring-cyan-500"
                      }`}
                    >
                      <option value="" disabled>Select a category</option>
                      <option value="tech-meetups">Tech Meetups</option>
                      <option value="workshops-training">Workshops & Training</option>
                      <option value="open-mic-comedy">Open Mic & Comedy</option>
                      <option value="fitness-bootcamp">Fitness & Bootcamp</option>
                      <option value="conferences">Conferences</option>
                      <option value="networking">Networking</option>
                      <option value="music-concerts">Music Concerts</option>
                      <option value="sports">Sports</option>
                      <option value="art-exhibitions">Art Exhibitions</option>
                      <option value="business">Business</option>
                      <option value="other">Other</option>
                    </select>
                  </FormInput>
                  <FormInput 
                    id="capacity" 
                    label="Capacity" 
                    type="number" 
                    placeholder="e.g., 150" 
                    value={formData.capacity} 
                    onChange={handleChange} 
                    error={errors.capacity} 
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Location Details</h3>
                  <FormInput 
                    id="location.venue" 
                    name="location.venue" 
                    label="Venue Name" 
                    type="text" 
                    placeholder="e.g., Innovation Hub" 
                    value={formData.location.venue} 
                    onChange={handleChange} 
                    error={errors.venue} 
                  />
                  <FormInput 
                    id="location.address" 
                    name="location.address" 
                    label="Address" 
                    type="text" 
                    placeholder="e.g., 123 Tech Street" 
                    value={formData.location.address} 
                    onChange={handleChange} 
                    error={errors.address} 
                  />
                  <FormInput 
                    id="location.city" 
                    name="location.city" 
                    label="City" 
                    type="text" 
                    placeholder="e.g., San Francisco" 
                    value={formData.location.city} 
                    onChange={handleChange} 
                    error={errors.city} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormInput 
                    id="startDateTime" 
                    label="Start Date & Time" 
                    type="datetime-local" 
                    value={formData.startDateTime} 
                    onChange={handleChange} 
                    error={errors.startDateTime} 
                  />
                  <FormInput 
                    id="endDateTime" 
                    label="End Date & Time" 
                    type="datetime-local" 
                    value={formData.endDateTime} 
                    onChange={handleChange} 
                    error={errors.endDateTime} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div className="flex items-center space-x-4">
                    <FormInput 
                      id="price" 
                      label="Price (₹)" 
                      type="number" 
                      placeholder="50" 
                      value={formData.price} 
                      onChange={handleChange} 
                      disabled={formData.isFree} 
                      error={errors.price} 
                    />
                    <div className="flex items-center h-12 mt-8">
                      <input 
                        type="checkbox" 
                        id="isFree" 
                        name="isFree" 
                        checked={formData.isFree} 
                        onChange={handleChange} 
                        className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-600" 
                      />
                      <label htmlFor="isFree" className="ml-2 text-sm font-medium text-gray-300">Is it Free?</label>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full bg-cyan-500 text-black font-bold rounded-full px-8 py-4 text-lg transition-all duration-300 ease-in-out hover:bg-cyan-600 hover:shadow-lg hover:shadow-cyan-500/30 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Creating Event...' : 'Create Event'}
                  </button>
                  {submitError && (
                    <p className="mt-4 text-center text-red-500 flex items-center justify-center">
                      <ExclamationIcon className="h-4 w-4 mr-2" />
                      {submitError}
                    </p>
                  )}
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
