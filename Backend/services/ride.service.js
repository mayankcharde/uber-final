const rideModel = require('../models/ride.model');
const mapService = require('./maps.service');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const captainModel = require('../models/captain.model');

async function getFare(pickup, destination) {
    try {
        if (!pickup || !destination) {
            throw new Error('Pickup and destination are required');
        }

        const distanceTime = await mapService.getDistanceTime(pickup, destination);
        
        if (!distanceTime || !distanceTime.distance || !distanceTime.duration) {
            throw new Error('Invalid distance and time data received');
        }

        const baseFare = {
            auto: 30,
            car: 50,
            moto: 20
        };

        const perKmRate = {
            auto: 10,
            car: 15,
            moto: 8
        };

        const perMinuteRate = {
            auto: 2,
            car: 3,
            moto: 1.5
        };

        // Convert distance from meters to kilometers and duration from seconds to minutes
        const distanceInKm = distanceTime.distance.value / 1000;
        const durationInMinutes = distanceTime.duration.value / 60;

        const fare = {
            auto: Math.round(baseFare.auto + (distanceInKm * perKmRate.auto) + (durationInMinutes * perMinuteRate.auto)),
            car: Math.round(baseFare.car + (distanceInKm * perKmRate.car) + (durationInMinutes * perMinuteRate.car)),
            moto: Math.round(baseFare.moto + (distanceInKm * perKmRate.moto) + (durationInMinutes * perMinuteRate.moto))
        };

        // Add minimum fare check
        const minimumFare = {
            auto: 50,
            car: 80,
            moto: 40
        };

        return {
            auto: Math.max(fare.auto, minimumFare.auto),
            car: Math.max(fare.car, minimumFare.car),
            moto: Math.max(fare.moto, minimumFare.moto),
            distance: distanceTime.distance,
            duration: distanceTime.duration
        };
    } catch (error) {
        console.error('Error in getFare:', error);
        throw new Error(error.message || 'Failed to calculate fare');
    }
}

module.exports.getFare = getFare;


function getOtp(num) {
    function generateOtp(num) {
        const otp = crypto.randomInt(Math.pow(10, num - 1), Math.pow(10, num)).toString();
        return otp;
    }
    return generateOtp(num);
}


module.exports.createRide = async ({
    user, pickup, destination, vehicleType
}) => {
    if (!user || !pickup || !destination || !vehicleType) {
        throw new Error('All fields are required');
    }

    const fare = await getFare(pickup, destination);

    const ride = rideModel.create({
        user,
        pickup,
        destination,
        otp: getOtp(6),
        fare: fare[vehicleType],
        distance: fare.distance.value / 1000, // Store distance in kilometers
        duration: fare.duration.value / 60 // Store duration in minutes
    })

    return ride;
}

module.exports.confirmRide = async ({
    rideId, captain
}) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'accepted',
        captain: captain._id
    })

    const ride = await rideModel.findOne({
        _id: rideId
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    return ride;

}

module.exports.startRide = async ({ rideId, otp, captain }) => {
    if (!rideId || !otp) {
        throw new Error('Ride id and OTP are required');
    }

    const ride = await rideModel.findOne({
        _id: rideId
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'accepted') {
        throw new Error('Ride not accepted');
    }

    if (ride.otp !== otp) {
        throw new Error('Invalid OTP');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'ongoing'
    })

    return ride;
}

module.exports.endRide = async ({ rideId, captain }) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        captain: captain._id
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'ongoing') {
        throw new Error('Ride not ongoing');
    }

    // Update ride status
    await rideModel.findOneAndUpdate(
        { _id: rideId },
        {
            status: 'completed'
        }
    );

    // Update captain's earnings
    await captainModel.findByIdAndUpdate(
        captain._id,
        { $inc: { earnings: ride.fare } }
    );

    return ride;
}

