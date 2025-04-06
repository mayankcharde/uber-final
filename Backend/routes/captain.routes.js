const captainController = require('../controllers/captain.controller');
const express = require('express');
const router = express.Router();
const { body } = require("express-validator")
const authMiddleware = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');


router.post('/register', [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email address')
        .normalizeEmail(),
    body('fullname.firstname')
        .trim()
        .isLength({ min: 3 })
        .withMessage('First name must be at least 3 characters long')
        .matches(/^[a-zA-Z\s]*$/)
        .withMessage('First name can only contain letters and spaces'),
    body('fullname.lastname')
        .optional()
        .trim()
        .matches(/^[a-zA-Z\s]*$/)
        .withMessage('Last name can only contain letters and spaces'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('vehicle.color')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Vehicle color must be at least 3 characters long'),
    body('vehicle.plate')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Vehicle plate must be at least 3 characters long'),
    body('vehicle.capacity')
        .isInt({ min: 1 })
        .withMessage('Vehicle capacity must be at least 1'),
    body('vehicle.vehicleType')
        .isIn(['car', 'motorcycle', 'auto'])
        .withMessage('Invalid vehicle type. Must be car, motorcycle, or auto')
],
    upload.single('photo'),
    captainController.registerCaptain
)


router.post('/login', [
    body('email').isEmail().withMessage('Invalid Email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
],
    captainController.loginCaptain
)


router.get('/profile', authMiddleware.authCaptain, captainController.getCaptainProfile)

router.get('/logout', authMiddleware.authCaptain, captainController.logoutCaptain)

router.get('/earnings', authMiddleware.authCaptain, captainController.getCaptainEarnings)

router.get('/stats', authMiddleware.authCaptain, captainController.getCaptainStats)

module.exports = router;