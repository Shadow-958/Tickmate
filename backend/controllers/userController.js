const User = require('../models/User.js');

/**
 * @desc    Create/update a user from a Clerk webhook
 * @route   POST /api/users/webhook
 */
const createUserOrUpdate = async (req, res) => {
    // console.log("✅ Webhook received!"); 
  const { data } = req.body;
  // Destructure all available fields from the Clerk webhook data
  const { id, email_addresses, first_name, last_name, image_url, username } = data;

  if (!id || !email_addresses) {
    return res.status(400).json({ message: 'Missing required Clerk user data' });
  }

  try {
    const user = await User.findOneAndUpdate(
      { clerkId: id },
      {
        clerkId: id,
        email: email_addresses[0].email_address,
        // Add the missing fields to be saved in the database
        firstName: first_name,
        lastName: last_name,
        username: username,
        photo: image_url,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error creating or updating user', error: error.message });
  }
};

/**
 * @desc    Set the role for a newly onboarded user
 * @route   POST /api/users/set-role
 */
const setUserRole = async (req, res) => {
  const { clerkId, role } = req.body;

  if (!clerkId || !role) {
    return res.status(400).json({ message: 'Clerk ID and role are required.' });
  }
  if (role !== 'attendee' && role !== 'organizer') {
    return res.status(400).json({ message: 'Invalid role specified.' });
  }

  try {
    const updatedUser = await User.findOneAndUpdate(
      { clerkId: clerkId },
      { $set: { role: role } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({ message: 'User role updated successfully!', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role', error: error.message });
  }
};

/**
 * @desc    Get the current user's profile from the database
 * @route   GET /api/users/me
 */
const getMyProfile = async (req, res) => {
  const { clerkId } = req.query;

  if (!clerkId) {
    return res.status(400).json({ message: 'Clerk ID is required' });
  }

  try {
    const user = await User.findOne({ clerkId: clerkId });
    if (!user) {
      return res.status(404).json({ message: 'User not found in database' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile', error: error.message });
  }
};

module.exports = { createUserOrUpdate, setUserRole, getMyProfile };
