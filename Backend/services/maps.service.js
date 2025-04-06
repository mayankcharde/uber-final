const axios = require('axios');
const captainModel = require('../models/captain.model');

function validateApiKey() {
    const apiKey = process.env.GOOGLE_MAPS_API;
    if (!apiKey) {
        throw new Error('Google Maps API key is not configured');
    }
    return apiKey;
}

module.exports.getAddressCoordinate = async (address) => {
    const apiKey = validateApiKey();
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        if (response.data.status === 'OK') {
            const location = response.data.results[0].geometry.location;
            return {
                ltd: location.lat,
                lng: location.lng
            };
        } else if (response.data.status === 'REQUEST_DENIED') {
            throw new Error('Google Maps API key is invalid or has insufficient permissions');
        } else {
            throw new Error(`Google Maps API error: ${response.data.status}`);
        }
    } catch (error) {
        console.error('Error in getAddressCoordinate:', error);
        throw error;
    }
}

module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    const apiKey = validateApiKey();
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}&mode=driving`;

    try {
        const response = await axios.get(url);
        
        if (response.data.status === 'REQUEST_DENIED') {
            throw new Error('Google Maps API key is invalid or has insufficient permissions');
        }
        
        if (response.data.status !== 'OK') {
            throw new Error(`Google Maps API error: ${response.data.status}`);
        }

        const element = response.data.rows[0].elements[0];
        
        if (element.status === 'ZERO_RESULTS') {
            throw new Error('No routes found between the specified locations');
        }
        
        if (element.status === 'NOT_FOUND') {
            throw new Error('One or both locations could not be found');
        }

        if (!element.distance || !element.duration) {
            throw new Error('Invalid response from Google Maps API');
        }

        return {
            distance: element.distance,
            duration: element.duration,
            status: element.status
        };
    } catch (err) {
        console.error('Error in getDistanceTime:', err);
        throw new Error(err.message || 'Failed to calculate distance and time');
    }
}

module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input || input.trim().length < 2) {
        return [];
    }

    const apiKey = validateApiKey();
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&types=address`;

    try {
        const response = await axios.get(url);
        if (response.data.status === 'OK') {
            return response.data.predictions.map(prediction => prediction.description).filter(value => value);
        } else if (response.data.status === 'REQUEST_DENIED') {
            console.error('Google Maps API key is invalid or has insufficient permissions');
            return [];
        } else {
            console.warn('Google Places API returned status:', response.data.status);
            return [];
        }
    } catch (err) {
        console.error('Error fetching suggestions:', err);
        return [];
    }
}

module.exports.getCaptainsInTheRadius = async (ltd, lng, radius) => {
    try {
        const captains = await captainModel.find({
            location: {
                $geoWithin: {
                    $centerSphere: [[ltd, lng], radius / 6371]
                }
            }
        });
        return captains;
    } catch (err) {
        console.error('Error finding captains in radius:', err);
        return [];
    }
}