import React, { useState, useEffect, useCallback } from 'react'
import { LoadScript, GoogleMap, Marker, DirectionsRenderer, Circle, Polyline } from '@react-google-maps/api'
import axios from 'axios'

const containerStyle = {
    width: '100%',
    height: '100%',
};

const defaultCenter = {
    lat: 28.6139,
    lng: 77.2090
};

const libraries = ['places'];

const LiveTracking = ({ ride }) => {
    const [currentPosition, setCurrentPosition] = useState(defaultCenter);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [map, setMap] = useState(null);
    const [markerIcon, setMarkerIcon] = useState(null);
    const [directions, setDirections] = useState(null);
    const [pickupCoords, setPickupCoords] = useState(null);
    const [destinationCoords, setDestinationCoords] = useState(null);
    const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
    const [mapOptions, setMapOptions] = useState(null);
    const [accuracy, setAccuracy] = useState(0);
    const [locationUpdateTime, setLocationUpdateTime] = useState(null);
    const [routePath, setRoutePath] = useState([]);

    // Initialize map options after Google Maps is loaded
    const onGoogleApiLoaded = useCallback(() => {
        if (!window.google || !window.google.maps) {
            console.log('Google Maps API not yet loaded');
            return;
        }
        
        try {
            const options = {
                mapTypeControl: true,
                mapTypeControlOptions: {
                    position: window.google.maps.ControlPosition.TOP_RIGHT,
                    style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                    mapTypeIds: [
                        window.google.maps.MapTypeId.ROADMAP,
                        window.google.maps.MapTypeId.SATELLITE,
                        window.google.maps.MapTypeId.HYBRID
                    ]
                },
                zoomControl: true,
                streetViewControl: false,
                fullscreenControl: true,
                gestureHandling: 'greedy'
            };
            setMapOptions(options);

            // Create marker icon
            const svgMarker = {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
            };
            setMarkerIcon(svgMarker);
            setIsGoogleMapsLoaded(true);
            console.log('Google Maps API loaded successfully');
        } catch (error) {
            console.error('Error initializing Google Maps:', error);
            setError('Failed to initialize map components');
        }
    }, []);

    const onLoad = useCallback((map) => {
        setMap(map);
        setIsLoading(false);
    }, []);

    // Get coordinates for pickup and destination
    useEffect(() => {
        const getCoordinates = async () => {
            if (!ride?.pickup || !ride?.destination) {
                console.log('No pickup or destination found in ride:', ride);
                return;
            }

            try {
                const pickupResponse = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/maps/get-coordinates`, {
                    params: { address: ride.pickup },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });

                const destinationResponse = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/maps/get-coordinates`, {
                    params: { address: ride.destination },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (pickupResponse.status === 200 && destinationResponse.status === 200) {
                    const pickup = {
                        lat: pickupResponse.data.ltd,
                        lng: pickupResponse.data.lng
                    };
                    const destination = {
                        lat: destinationResponse.data.ltd,
                        lng: destinationResponse.data.lng
                    };
                    
                    setPickupCoords(pickup);
                    setDestinationCoords(destination);
                }
            } catch (error) {
                console.error('Error getting coordinates:', error);
                setError('Failed to get location coordinates');
            }
        };

        getCoordinates();
    }, [ride]);

    // Get directions when coordinates are available
    useEffect(() => {
        if (!pickupCoords || !destinationCoords || !map || !isGoogleMapsLoaded || !window.google) {
            return;
        }

        try {
            const directionsService = new window.google.maps.DirectionsService();
            directionsService.route(
                {
                    origin: pickupCoords,
                    destination: destinationCoords,
                    travelMode: window.google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (status === window.google.maps.DirectionsStatus.OK) {
                        setDirections(result);
                        const path = result.routes[0].overview_path;
                        setRoutePath(path);
                    } else {
                        console.error('Error getting directions:', status);
                        setError('Failed to get route directions');
                    }
                }
            );
        } catch (error) {
            console.error('Error creating directions service:', error);
            setError('Failed to create directions service');
        }
    }, [pickupCoords, destinationCoords, map, isGoogleMapsLoaded]);

    // Get current location with high accuracy and retry logic
    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setIsLoading(false);
            return;
        }

        let retryCount = 0;
        const maxRetries = 3;
        let watchId = null;

        const successHandler = (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            setCurrentPosition({ lat: latitude, lng: longitude });
            setAccuracy(accuracy);
            setLocationUpdateTime(new Date());
            setIsLoading(false);
            setError(null);
            retryCount = 0;

            if (map && !locationUpdateTime) {
                map.panTo({ lat: latitude, lng: longitude });
                map.setZoom(16);
            }
        };

        const errorHandler = (error) => {
            console.error('Error getting location:', error);
            
            let errorMessage = 'Error getting your location. ';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'Please enable location services in your browser settings.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'Location information is unavailable.';
                    break;
                case error.TIMEOUT:
                    if (retryCount < maxRetries) {
                        retryCount++;
                        console.log(`Retrying location request (${retryCount}/${maxRetries})...`);
                        getCurrentPosition();
                        return;
                    } else {
                        errorMessage += 'Location request timed out. Please check your connection.';
                    }
                    break;
                default:
                    errorMessage += 'An unknown error occurred.';
            }
            
            setError(errorMessage);
            setIsLoading(false);
        };

        const locationOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000
        };

        const getCurrentPosition = () => {
            navigator.geolocation.getCurrentPosition(
                successHandler,
                errorHandler,
                locationOptions
            );
        };

        const startWatchPosition = () => {
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
            }

            watchId = navigator.geolocation.watchPosition(
                successHandler,
                errorHandler,
                locationOptions
            );
        };

        getCurrentPosition();
        startWatchPosition();

        return () => {
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [map]);

    const RetryButton = () => (
        <button
            onClick={() => {
                setError(null);
                setIsLoading(true);
                setLocationUpdateTime(null);
            }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
            Retry Location Access
        </button>
    );

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading map...</p>
                    <p className="mt-1 text-sm text-gray-500">Getting your location...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center p-4">
                <div className="text-center">
                    <div className="text-red-600 mb-2">{error}</div>
                    <p className="text-sm text-gray-600 mb-4">
                        Make sure location services are enabled and try again.
                    </p>
                    <RetryButton />
                </div>
            </div>
        );
    }

    return (
        <LoadScript 
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={libraries}
            onLoad={onGoogleApiLoaded}
            onError={(error) => {
                console.error('Google Maps Script Error:', error);
                setError('Failed to load Google Maps');
            }}
        >
            {isGoogleMapsLoaded && window.google ? (
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={currentPosition}
                    zoom={16}
                    onLoad={onLoad}
                    options={mapOptions}
                >
                    {currentPosition && markerIcon && (
                        <>
                            <Marker
                                position={currentPosition}
                                icon={markerIcon}
                                title="Your Location"
                                animation={window.google.maps.Animation.BOUNCE}
                            />
                            <Circle
                                center={currentPosition}
                                radius={accuracy}
                                options={{
                                    fillColor: "#4285F4",
                                    fillOpacity: 0.1,
                                    strokeColor: "#4285F4",
                                    strokeOpacity: 0.3,
                                    strokeWeight: 1,
                                }}
                            />
                        </>
                    )}

                    {pickupCoords && (
                        <Marker
                            position={pickupCoords}
                            title="Pickup Location"
                            icon={{
                                url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                                scaledSize: new window.google.maps.Size(40, 40)
                            }}
                        />
                    )}

                    {destinationCoords && (
                        <Marker
                            position={destinationCoords}
                            title="Destination"
                            icon={{
                                url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                                scaledSize: new window.google.maps.Size(40, 40)
                            }}
                        />
                    )}

                    {routePath.length > 0 && (
                        <>
                            <Polyline
                                path={routePath}
                                options={{
                                    strokeColor: '#4285F4',
                                    strokeOpacity: 1,
                                    strokeWeight: 4,
                                    geodesic: true,
                                }}
                            />
                            <Polyline
                                path={routePath}
                                options={{
                                    strokeColor: '#4285F4',
                                    strokeOpacity: 0.2,
                                    strokeWeight: 8,
                                    geodesic: true,
                                }}
                            />
                        </>
                    )}

                    {directions && (
                        <DirectionsRenderer
                            directions={directions}
                            options={{
                                suppressMarkers: true,
                                polylineOptions: {
                                    visible: false
                                },
                                suppressInfoWindows: true,
                                preserveViewport: true
                            }}
                        />
                    )}
                </GoogleMap>
            ) : (
                <div className="h-full w-full flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading Google Maps...</p>
                    </div>
                </div>
            )}
        </LoadScript>
    );
};

export default LiveTracking;