import React, { useContext, useEffect, useState } from 'react'
import { UserDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const UserProtectWrapper = ({
    children
}) => {
    const token = localStorage.getItem('token')
    const navigate = useNavigate()
    const { user, setUser } = useContext(UserDataContext)
    const [ isLoading, setIsLoading ] = useState(true)
    const [ error, setError ] = useState(null)

    useEffect(() => {
        const checkAuth = async () => {
            if (!token) {
                navigate('/login')
                return
            }

            try {
                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/users/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    withCredentials: true
                })

                if (response.status === 200) {
                    setUser(response.data)
                    setIsLoading(false)
                }
            } catch (err) {
                console.error('Auth check error:', err)
                setError(err.response?.data?.message || 'Authentication failed')
                localStorage.removeItem('token')
                navigate('/login')
            } finally {
                setIsLoading(false)
            }
        }

        checkAuth()
    }, [token, navigate, setUser])

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

export default UserProtectWrapper