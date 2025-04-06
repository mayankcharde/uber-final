import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { CaptainDataContext } from '../context/CapatainContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const CaptainSignup = () => {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y')

  const [vehicleColor, setVehicleColor] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [vehicleCapacity, setVehicleCapacity] = useState('')
  const [vehicleType, setVehicleType] = useState('')

  const { captain, setCaptain } = React.useContext(CaptainDataContext)

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const submitHandler = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate data before sending
      if (!firstName.trim() || firstName.trim().length < 3) {
        throw new Error('First name must be at least 3 characters long')
      }
      if (!email.trim() || !email.includes('@')) {
        throw new Error('Please enter a valid email address')
      }
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters long')
      }
      if (!vehicleColor.trim() || vehicleColor.trim().length < 3) {
        throw new Error('Vehicle color must be at least 3 characters long')
      }
      if (!vehiclePlate.trim() || vehiclePlate.trim().length < 3) {
        throw new Error('Vehicle plate must be at least 3 characters long')
      }
      if (!vehicleCapacity || parseInt(vehicleCapacity) < 1) {
        throw new Error('Vehicle capacity must be at least 1')
      }
      if (!vehicleType || !['car', 'motorcycle', 'auto'].includes(vehicleType.toLowerCase())) {
        throw new Error('Please select a valid vehicle type')
      }

      // Create the data object first
      const data = {
        fullname: {
          firstname: firstName.trim(),
          lastname: lastName.trim() || undefined
        },
        email: email.trim().toLowerCase(),
        password: password,
        vehicle: {
          color: vehicleColor.trim(),
          plate: vehiclePlate.trim(),
          capacity: parseInt(vehicleCapacity),
          vehicleType: vehicleType.toLowerCase()
        }
      }

      // Create form data
      const formData = new FormData()
      
      // Add the JSON data
      formData.append('data', JSON.stringify(data))

      // Handle photo if exists
      if (photo) {
        formData.append('photo', photo)
      }

      // Log form data for debugging
      console.log('Form Data:', data)

      // Send request
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/captains/register`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        withCredentials: true
      })

      if (response.status === 201) {
        const data = response.data
        setCaptain(data.captain)
        localStorage.setItem('token', data.token)
        navigate('/captain-home')
      }
    } catch (error) {
      console.error('Registration error:', error)
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.msg)
        setError(errorMessages.join('\n'))
      } else if (error.response?.data?.message) {
        setError(error.response.data.message)
      } else {
        setError(error.message || 'Failed to register. Please try again.')
      }
    } finally {
      setLoading(false)
    }

    // Clear form
    setEmail('')
    setFirstName('')
    setLastName('')
    setPassword('')
    setVehicleColor('')
    setVehiclePlate('')
    setVehicleCapacity('')
    setVehicleType('')
    setPhoto(null)
    setPhotoPreview('https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y')
  }

  return (
    <div className='py-5 px-5 h-screen flex flex-col justify-between'>
      <div>
        <img className='w-20 mb-3' src="https://www.svgrepo.com/show/505031/uber-driver.svg" alt="" />

        <form onSubmit={(e) => {
          submitHandler(e)
        }}>
          {error && (
            <div className="text-red-500 mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col items-center mb-7">
            <img 
              src={photoPreview} 
              alt="Profile preview" 
              className="w-24 h-24 rounded-full object-cover mb-2"
            />
            <label className="cursor-pointer bg-[#eeeeee] rounded-lg px-4 py-2 text-sm">
              Upload Photo
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          </div>

          <h3 className='text-lg w-full font-medium mb-2'>What's our Captain's name</h3>
          <div className='flex gap-4 mb-7'>
            <input
              required
              className='bg-[#eeeeee] w-1/2 rounded-lg px-4 py-2 border text-lg placeholder:text-base'
              type="text"
              placeholder='First name'
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value)
              }}
            />
            <input
              required
              className='bg-[#eeeeee] w-1/2 rounded-lg px-4 py-2 border text-lg placeholder:text-base'
              type="text"
              placeholder='Last name'
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value)
              }}
            />
          </div>

          <h3 className='text-lg font-medium mb-2'>What's our Captain's email</h3>
          <input
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
            }}
            className='bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg placeholder:text-base'
            type="email"
            placeholder='email@example.com'
          />

          <h3 className='text-lg font-medium mb-2'>Create a password</h3>
          <input
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
            }}
            className='bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg placeholder:text-base'
            type="password"
            placeholder='password'
          />

          <h3 className='text-lg font-medium mb-2'>Vehicle Details</h3>
          <div className='grid grid-cols-2 gap-4 mb-7'>
            <input
              required
              value={vehicleColor}
              onChange={(e) => {
                setVehicleColor(e.target.value)
              }}
              className='bg-[#eeeeee] rounded-lg px-4 py-2 border text-lg placeholder:text-base'
              type="text"
              placeholder='Vehicle Color'
            />
            <input
              required
              value={vehiclePlate}
              onChange={(e) => {
                setVehiclePlate(e.target.value)
              }}
              className='bg-[#eeeeee] rounded-lg px-4 py-2 border text-lg placeholder:text-base'
              type="text"
              placeholder='Vehicle Plate'
            />
            <input
              required
              value={vehicleCapacity}
              onChange={(e) => {
                setVehicleCapacity(e.target.value)
              }}
              className='bg-[#eeeeee] rounded-lg px-4 py-2 border text-lg placeholder:text-base'
              type="number"
              placeholder='Vehicle Capacity'
            />
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Vehicle Type</option>
              <option value="car">Car</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <button
            disabled={loading}
            className={`bg-[#111] text-white font-semibold mb-3 rounded-lg px-4 py-2 w-full text-lg placeholder:text-base ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>

        </form>
        <p className='text-center'>Already have an account? <Link to='/captain-login' className='text-blue-600'>Sign in</Link></p>
      </div>
      <div>
        <Link
          to='/login'
          className='bg-[#10b461] flex items-center justify-center text-white font-semibold mb-5 rounded-lg px-4 py-2 w-full text-lg placeholder:text-base'
        >Sign in as User</Link>
      </div>
    </div>
  )
}

export default CaptainSignup