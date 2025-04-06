const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/create',
    authMiddleware.authUser,
    [
        body('rideId').isMongoId().withMessage('Invalid ride ID'),
        body('amount').isNumeric().withMessage('Amount must be a number')
    ],
    paymentController.createPayment
);

router.post('/verify',
    authMiddleware.authUser,
    [
        body('rideId').isMongoId().withMessage('Invalid ride ID'),
        body('paymentId').isString().withMessage('Payment ID is required')
    ],
    paymentController.verifyPayment
);

module.exports = router; 