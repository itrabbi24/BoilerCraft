const express = require('express');
const router = express.Router();
const { getHealth, getUsers, createUser } = require('../controllers/userController');

router.get('/health', getHealth);
router.get('/users', getUsers);
router.post('/users', createUser);

module.exports = router;
