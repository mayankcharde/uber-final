import React, { useContext, useEffect, useState } from 'react'
import { CaptainDataContext } from '../context/CapatainContext'
import axios from 'axios'

const CaptainDetails = () => {
    const { captain } = useContext(CaptainDataContext)
    const [earnings, setEarnings] = useState(0)
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalDistance: 0,
        totalDuration: 0,
        totalRides: 0
    })

    const fetchEarnings = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/captains/earnings`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })
            if (response.status === 200) {
                setEarnings(response.data.earnings)
            }
        } catch (error) {
            console.error('Error fetching earnings:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/captains/stats`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })
            if (response.status === 200) {
                setStats(response.data)
            }
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    useEffect(() => {
        fetchEarnings()
        fetchStats()
        // Refresh data every 30 seconds
        const interval = setInterval(() => {
            fetchEarnings()
            fetchStats()
        }, 30000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div>
            <div className='flex items-center justify-between'>
                <div className='flex items-center justify-start gap-3'>
                    <img className='h-10 w-10 rounded-full object-cover' src={captain.photo} alt={captain.fullname.firstname} />
                    <h4 className='text-lg font-medium capitalize'>{captain.fullname.firstname + " " + captain.fullname.lastname}</h4>
                </div>
                <div>
                    <h4 className='text-xl font-semibold'>₹{loading ? '...' : earnings.toFixed(2)}</h4>
                    <p className='text-sm text-gray-600'>Earned</p>
                </div>
            </div>
            <div className='flex p-3 mt-8 bg-gray-100 rounded-xl justify-center gap-5 items-start'>
                <div className='text-center'>
                    <i className="text-3xl mb-2 font-thin ri-timer-2-line"></i>
                    <h5 className='text-lg font-medium'>{stats.totalDuration.toFixed(1)}</h5>
                    <p className='text-sm text-gray-600'>Hours Online</p>
                </div>
                <div className='text-center'>
                    <i className="text-3xl mb-2 font-thin ri-speed-up-line"></i>
                    <h5 className='text-lg font-medium'>{stats.totalDistance.toFixed(1)}</h5>
                    <p className='text-sm text-gray-600'>KM Driven</p>
                </div>
                <div className='text-center'>
                    <i className="text-3xl mb-2 font-thin ri-booklet-line"></i>
                    <h5 className='text-lg font-medium'>{stats.totalRides}</h5>
                    <p className='text-sm text-gray-600'>Total Rides</p>
                </div>
            </div>
        </div>
    )
}

export default CaptainDetails