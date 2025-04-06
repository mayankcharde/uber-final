const rideModel = require('../models/ride.model');
const captainModel = require('../models/captain.model');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

module.exports.createPayment = async ({ rideId, amount }) => {
    if (!rideId || !amount) {
        throw new Error('Ride ID and amount are required');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        status: 'completed'
    });

    if (!ride) {
        throw new Error('Ride not found or not completed');
    }

    // Create Razorpay order
    const options = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency: "INR",
        receipt: `ride_${rideId}_${Date.now()}`,
        payment_capture: 1
    };

    try {
        const order = await razorpay.orders.create(options);
        
        // Update ride with order details
        await rideModel.findOneAndUpdate(
            { _id: rideId },
            {
                orderId: order.id,
                paymentStatus: 'pending'
            }
        );

        return {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID
        };
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        throw new Error('Failed to create payment order');
    }
};

module.exports.verifyPayment = async ({ rideId, razorpay_payment_id, razorpay_order_id, razorpay_signature }) => {
    if (!rideId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        throw new Error('Missing payment verification details');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        orderId: razorpay_order_id
    }).populate('captain');

    if (!ride) {
        throw new Error('Invalid payment details');
    }

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest("hex");

    if (razorpay_signature !== expectedSign) {
        throw new Error('Invalid payment signature');
    }

    // Update ride with payment details
    await rideModel.findOneAndUpdate(
        { _id: rideId },
        {
            paymentID: razorpay_payment_id,
            paymentStatus: 'completed',
            paymentDate: new Date()
        }
    );

    // Update captain's earnings
    if (ride.captain) {
        await captainModel.findByIdAndUpdate(
            ride.captain._id,
            { $inc: { earnings: ride.fare } }
        );
    }

    return {
        success: true,
        message: 'Payment verified successfully'
    };
}; 