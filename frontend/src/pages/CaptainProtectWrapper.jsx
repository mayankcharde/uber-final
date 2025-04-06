import React, { useContext, useEffect, useState } from 'react'
import { CaptainDataContext } from '../context/CapatainContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const CaptainProtectWrapper = ({
    children
}) => {
    const token = localStorage.getItem('token')
    const navigate = useNavigate()
    const { captain, setCaptain } = useContext(CaptainDataContext)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const checkAuth = async () => {
            if (!token) {
                navigate('/captain-login')
                return
            }

            try {
                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/captains/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })

                if (response.status === 200) {
                    setCaptain(response.data.captain)
                    setIsLoading(false)
                }
            } catch (err) {
                console.error('Auth check error:', err)
                setError(err.response?.data?.message || 'Authentication failed')
                localStorage.removeItem('token')
                navigate('/captain-login')
            } finally {
                setIsLoading(false)
            }
        }

        checkAuth()
    }, [token, navigate, setCaptain])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center text-red-500">
                    {error}
                </div>
            </div>
        )
    }

    return (
        <>
            {children}
        </>
    )
}

export default CaptainProtectWrapper