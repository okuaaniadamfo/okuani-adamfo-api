import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

// register
export const registerUser = async (req, res) => {
  const { username, firstName, lastName, phoneNumber, password } = req.body;

  if (!username || !firstName || !lastName || !phoneNumber || !password) {
    return res.status(400).json({ error: 'Please provide all required fields.' });
  }

  try {
    const existingUser = await User.findOne({ 
      $or: [{ username }, { phoneNumber }] 
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or phone number already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      firstName,
      lastName,
      phoneNumber,
      password: hashedPassword,
    });

    res.status(201).json({ 
      message: 'User registered successfully', 
      user: { id: user._id, username: user.username, phoneNumber: user.phoneNumber } 
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
};


// login
export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Please provide username and password.' });
  }

  try {
    const user = await User.findOne({ username });

    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Login error:', err);  // <--- Add this line
    res.status(500).json({ error: 'Login failed' });
  }
};



