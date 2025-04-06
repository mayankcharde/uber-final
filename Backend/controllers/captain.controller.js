const captainModel = require('../models/captain.model');
const captainService = require('../services/captain.service');
const blacklistTokenModel = require('../models/blacklist-token.model'); // Updated import name
const { validationResult } = require('express-validator');
const rideModel = require('../models/ride.model');

module.exports.registerCaptain = async (req, res, next) => {
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

        const { fullname, email, password, vehicle } = data;
        
        // Validate required fields
        if (!fullname?.firstname || !email || !password || !vehicle?.color || !vehicle?.plate || !vehicle?.capacity || !vehicle?.vehicleType) {
            return res.status(400).json({ 
                message: 'Missing required fields',
                errors: [
                    { msg: !fullname?.firstname ? 'First name is required' : null },
                    { msg: !email ? 'Email is required' : null },
                    { msg: !password ? 'Password is required' : null },
                    { msg: !vehicle?.color ? 'Vehicle color is required' : null },
                    { msg: !vehicle?.plate ? 'Vehicle plate is required' : null },
                    { msg: !vehicle?.capacity ? 'Vehicle capacity is required' : null },
                    { msg: !vehicle?.vehicleType ? 'Vehicle type is required' : null }
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

        // Validate vehicle type
        if (!['car', 'motorcycle', 'auto'].includes(vehicle.vehicleType.toLowerCase())) {
            return res.status(400).json({
                message: 'Invalid vehicle type',
                errors: [{ msg: 'Vehicle type must be car, motorcycle, or auto' }]
            });
        }

        const photo = req.file ? `/uploads/${req.file.filename}` : undefined;

        console.log('Processed data:', { fullname, email, vehicle, photo });

        const isCaptainAlreadyExist = await captainModel.findOne({ email });

        if (isCaptainAlreadyExist) {
            return res.status(400).json({ message: 'Captain already exists with this email' });
        }

        const hashedPassword = await captainModel.hashPassword(password);

        const captain = await captainService.createCaptain({
            firstname: fullname.firstname.trim(),
            lastname: fullname.lastname?.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            color: vehicle.color.trim(),
            plate: vehicle.plate.trim(),
            capacity: parseInt(vehicle.capacity),
            vehicleType: vehicle.vehicleType.toLowerCase(),
            photo
        });

        const token = captain.generateAuthToken();

        res.status(201).json({ token, captain });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: 'Internal server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

module.exports.loginCaptain = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const captain = await captainModel.findOne({ email }).select('+password');

    if (!captain) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await captain.comparePassword(password);

    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = captain.generateAuthToken();

    res.cookie('token', token);

    res.status(200).json({ token, captain });
}

module.exports.getCaptainProfile = async (req, res, next) => {
    res.status(200).json({ captain: req.captain });
}

module.exports.logoutCaptain = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    try {
        await blacklistTokenModel.create({ token });
        res.clearCookie('token');
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error during logout' });
    }
}

module.exports.getCaptainEarnings = async (req, res) => {
    try {
        const captain = await captainModel.findById(req.captain._id).select('earnings');
        res.status(200).json({ earnings: captain.earnings });
    } catch (error) {
        console.error('Error fetching captain earnings:', error);
        res.status(500).json({ message: 'Error fetching earnings' });
    }
};

module.exports.getCaptainStats = async (req, res) => {
    try {
        const completedRides = await rideModel.find({
            captain: req.captain._id,
            status: 'completed'
        });

        const stats = {
            totalDistance: 0,
            totalDuration: 0,
            totalRides: completedRides.length
        };

        completedRides.forEach(ride => {
            stats.totalDistance += ride.distance || 0;
            stats.totalDuration += ride.duration || 0;
        });

        res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching captain stats:', error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
};