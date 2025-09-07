const Event = require('../models/Event.js');
const User = require('../models/User.js');

const getEvents = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category) {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    const events = await Event.find(filter);
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer');
    if (event) {
      res.status(200).json(event);
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event details', error: error.message });
  }
};

const createEvent = async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      pricing: typeof req.body.pricing === 'string' ? JSON.parse(req.body.pricing) : req.body.pricing
    };

    const { title, description, category, location, startDateTime, endDateTime, pricing, capacity, clerkId } = eventData;

    const organizer = await User.findOne({ clerkId: clerkId });
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer user not found.' });
    }

    const newEventData = {
      title,
      description,
      category,
      location,
      startDateTime,
      endDateTime,
      pricing,
      capacity: Number(capacity),
      organizer: organizer._id,
    };

    if (req.file) {
      newEventData.bannerImageUrl = req.file.path;
    }

    const newEvent = new Event(newEventData);
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error("EVENT CREATION ERROR:", error);
    res.status(500).json({ message: 'Error creating event', error: error.message });
  }
};

module.exports = { getEvents, getEventById, createEvent };
