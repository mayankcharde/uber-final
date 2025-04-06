const paymentService = require('../services/payment.service');
const { validationResult } = require('express-validator');

module.exports.createPayment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, amount } = req.body;

    try {
        const payment = await paymentService.createPayment({ rideId, amount });
        return res.status(200).json(payment);
    } catch (error) {
        console.error('Payment creation error:', error);
        return res.status(500).json({ message: error.message });
    }
};

module.exports.verifyPayment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { 
        rideId, 
        razorpay_payment_id, 
        razorpay_order_id, 
        razorpay_signature 
    } = req.body;

    try {
        const result = await paymentService.verifyPayment({
            rideId,
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature
        });
        return res.status(200).json(result);
    } catch (error) {
        console.error('Payment verification error:', error);
        return res.status(500).json({ message: error.message });
    }
}; 