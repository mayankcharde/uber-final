import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { CaptainDataContext } from '../context/CapatainContext'
import { useContext } from 'react'

const FinishRide = (props) => {
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { setCaptain } = useContext(CaptainDataContext)

    async function endRide() {
        setError('')
        setLoading(true)

        try {
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/rides/end-ride`, {
                rideId: props.ride._id
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (response.status === 200) {
                // Fetch updated captain data including earnings
                const captainResponse = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/captains/profile`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                })
                
                if (captainResponse.status === 200) {
                    setCaptain(captainResponse.data.captain)
                }
                
                navigate('/captain-home')
            }
        } catch (error) {
            console.error('Error ending ride:', error);
            setError(error.response?.data?.message || 'Failed to end ride. Please try again.');
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <h5 className='p-1 text-center w-[90%] absolute top-0' onClick={() => {
                props.setFinishRidePanel(false)
            }}><i className="text-3xl text-gray-800 ri-arrow-down-wide-line"></i></h5>

            <div className='flex items-center justify-between'>
                <img className='h-12' src="https://swyft.pl/wp-content/uploads/2023/05/how-many-people-can-a-uberx-take.jpg" alt="" />
                <div className='text-right'>
                    <h2 className='text-lg font-medium capitalize'>{props.ride?.user?.fullname?.firstname || 'User'}</h2>
                    <h4 className='text-xl font-semibold -mt-1 -mb-1'>₹{props.ride?.fare || 0}</h4>
                    <p className='text-sm text-gray-600'>Fare</p>
                </div>
            </div>

            <div className='mt-6 space-y-4'>
                <div className='flex items-center gap-5 p-3 border-b-2'>
                    <i className="ri-map-pin-user-fill"></i>
                    <div>
                        <h3 className='text-lg font-medium'>Pickup</h3>
                        <p className='text-sm -mt-1 text-gray-600'>{props.ride?.pickup}</p>
                    </div>
                </div>
                <div className='flex items-center gap-5 p-3 border-b-2'>
                    <i className="text-lg ri-map-pin-2-fill"></i>
                    <div>
                        <h3 className='text-lg font-medium'>Destination</h3>
                        <p className='text-sm -mt-1 text-gray-600'>{props.ride?.destination}</p>
                    </div>
                </div>
                <div className='flex items-center justify-between p-3'>
                    <div className='flex items-center gap-5'>
                        <i className="ri-speed-up-line"></i>
                        <div>
                            <h3 className='text-lg font-medium'>{props.ride?.distance?.toFixed(1) || '0.0'} KM</h3>
                            <p className='text-sm -mt-1 text-gray-600'>Distance</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5'>
                        <i className="ri-time-line"></i>
                        <div>
                            <h3 className='text-lg font-medium'>{props.ride?.duration?.toFixed(0) || '0'} min</h3>
                            <p className='text-sm -mt-1 text-gray-600'>Duration</p>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            <button
                onClick={endRide}
                disabled={loading}
                className='w-full mt-5 bg-green-600 text-white font-semibold p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed'
            >
                {loading ? 'Completing Ride...' : 'Complete Ride'}
            </button>
        </div>
    )
}

export default FinishRide