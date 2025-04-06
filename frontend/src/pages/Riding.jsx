import React, { useState, useEffect, useContext } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SocketContext } from '../context/SocketContext'
import LiveTracking from '../components/LiveTracking'
import axios from 'axios'

const Riding = () => {
    const location = useLocation()
    const { ride } = location.state || {}
    const { socket } = useContext(SocketContext)
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!ride) {
            navigate('/home')
            return
        }

        socket.on("ride-ended", () => {
            navigate('/home')
        })

        return () => {
            socket.off("ride-ended")
        }
    }, [socket, navigate, ride])

    const handlePayment = async () => {
        if (!ride) {
            setError('Ride information not found')
            return
        }

        setError('')
        setLoading(true)

        try {
            // Create payment order
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/payments/create`, {
                rideId: ride._id,
                amount: ride.fare
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (response.status === 200) {
                const options = {
                    key: response.data.key,
                    amount: response.data.amount,
                    currency: response.data.currency,
                    name: "Ride Payment",
                    description: "Payment for your ride",
                    order_id: response.data.orderId,
                    handler: async (response) => {
                        try {
                            // Verify payment
                            await axios.post(`${import.meta.env.VITE_BASE_URL}/api/payments/verify`, {
                                rideId: ride._id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature
                            }, {
                                headers: {
                                    Authorization: `Bearer ${localStorage.getItem('token')}`
                                }
                            });

                            // Emit ride-ended event to socket
                            socket.emit('ride-ended', { rideId: ride._id });

                            // Navigate to home page after successful payment
                            navigate('/home', { replace: true });
                        } catch (error) {
                            console.error('Payment verification error:', error);
                            setError('Payment verification failed. Please contact support.');
                        }
                    },
                    prefill: {
                        name: ride.user?.fullname?.firstname || '',
                        email: ride.user?.email || '',
                        contact: ride.user?.phone || ""
                    },
                    theme: {
                        color: "#4CAF50"
                    }
                };

                const razorpay = new window.Razorpay(options);
                razorpay.open();

                // Handle payment modal close
                razorpay.on('payment.failed', (response) => {
                    console.error('Payment failed:', response.error);
                    setError('Payment failed. Please try again.');
                    setLoading(false);
                });
            }
        } catch (error) {
            console.error('Payment error:', error);
            setError(error.response?.data?.message || 'Payment failed. Please try again.');
        } finally {
            setLoading(false)
        }
    }

    if (!ride) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">No ride information found</h2>
                    <button 
                        onClick={() => navigate('/home')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className='h-screen'>
            <Link to='/home' className='fixed right-2 top-2 h-10 w-10 bg-white flex items-center justify-center rounded-full'>
                <i className="text-lg font-medium ri-home-5-line"></i>
            </Link>
            <div className='h-1/2'>
                <LiveTracking ride={ride} />
            </div>
            <div className='h-1/2 p-4'>
                <div className='flex items-center justify-between'>
                    <img className='h-12' src="https://swyft.pl/wp-content/uploads/2023/05/how-many-people-can-a-uberx-take.jpg" alt="" />
                    <div className='text-right'>
                        <h2 className='text-lg font-medium capitalize'>{ride?.captain?.fullname?.firstname || 'Captain'}</h2>
                        <h4 className='text-xl font-semibold -mt-1 -mb-1'>{ride?.captain?.vehicle?.plate || 'N/A'}</h4>
                        <p className='text-sm text-gray-600'>Maruti Suzuki Alto</p>
                    </div>
                </div>

                <div className='flex gap-2 justify-between flex-col items-center'>
                    <div className='w-full mt-5'>
                        <div className='flex items-center gap-5 p-3 border-b-2'>
                            <i className="text-lg ri-map-pin-2-fill"></i>
                            <div>
                                <h3 className='text-lg font-medium'>562/11-A</h3>
                                <p className='text-sm -mt-1 text-gray-600'>{ride?.destination || 'Destination'}</p>
                            </div>
                        </div>
                        <div className='flex items-center gap-5 p-3'>
                            <i className="ri-currency-line"></i>
                            <div>
                                <h3 className='text-lg font-medium'>₹{ride?.fare || 0}</h3>
                                <p className='text-sm -mt-1 text-gray-600'>Cash</p>
                            </div>
                        </div>
                    </div>
                </div>
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}
                <button 
                    onClick={() => navigate('/home', { replace: true })}
                    className='w-full mt-5 bg-gray-600 text-white font-semibold p-2 rounded-lg hover:bg-gray-700 transition-colors'
                >
                    Go to Home
                </button>
                <button 
                    onClick={handlePayment}
                    disabled={loading}
                    className='w-full mt-3 bg-green-600 text-white font-semibold p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors'
                >
                    {loading ? 'Processing Payment...' : 'Make Payment'}
                </button>
            </div>
        </div>
    )
}

export default Riding