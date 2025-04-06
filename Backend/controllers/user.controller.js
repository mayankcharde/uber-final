const userModel = require('../models/user.model');
const userService = require('../services/user.service');
const { validationResult } = require('express-validator');
const blacklistTokenModel = require('../models/blacklist-token.model'); // Updated import name

module.exports.registerUser = async (req, res, next) => {
    try {
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);
        
        let data;
        try {
            data = JSON.parse(req.body.data);
        } catch (error) {
            return res.status(400).json({ 
                message: 'Invalid data format',
                errors: [{ msg: 'Data must be valid JSON' }]
            });
        }

        const { fullname, email, password } = data;
        
        // Validate required fields
        if (!fullname?.firstname || !email || !password) {
            return res.status(400).json({ 
                message: 'Missing required fields',
                errors: [
                    { msg: !fullname?.firstname ? 'First name is required' : null },
                    { msg: !email ? 'Email is required' : null },
                    { msg: !password ? 'Password is required' : null }
                ].filter(error => error.msg)
            });
        }

        // Validate email format
        if (!email.match(/^\S+@\S+\.\S+$/)) {
            return res.status(400).json({
                message: 'Invalid email format',
                errors: [{ msg: 'Please enter a valid email address' }]
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                message: 'Invalid password',
                errors: [{ msg: 'Password must be at least 6 characters long' }]
            });
        }

        // Validate first name length
        if (fullname.firstname.trim().length < 3) {
            return res.status(400).json({
                message: 'Invalid first name',
                errors: [{ msg: 'First name must be at least 3 characters long' }]
            });
        }

        const photo = req.file ? `/uploads/${req.file.filename}` : undefined;

        console.log('Processed data:', { fullname, email, photo });

        const isUserAlready = await userModel.findOne({ email: email.toLowerCase() });

        if (isUserAlready) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const hashedPassword = await userModel.hashPassword(password);

        const user = await userService.createUser({
            firstname: fullname.firstname.trim(),
            lastname: fullname.lastname?.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            photo
        });

        const token = user.generateAuthToken();

        res.status(201).json({ token, user });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: 'Internal server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

module.exports.loginUser = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await userModel.findOne({ email }).select('+password');

    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = user.generateAuthToken();

    res.cookie('token', token);

    res.status(200).json({ token, user });
}

module.exports.getUserProfile = async (req, res, next) => {

    res.status(200).json(req.user);

}

module.exports.logoutUser = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    try {
        await blacklistTokenModel.create({ token });
        res.clearCookie('token');
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error during logout' });
    }
}