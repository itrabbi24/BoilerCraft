const User = require('../models/User');

exports.getHealth = async (req, res) => {
  res.json({
    status: 'online',
    app: '{{APP_TITLE}}',
    description: '{{APP_DESC}}',
    author: '{{AUTHOR}}',
    database: 'MongoDB connected via Mongoose',
    timestamp: new Date().toISOString()
  });
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
