import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { UserDataContext } from '../context/UserContext'

const UserSignup = () => {
  const [ email, setEmail ] = useState('')
  const [ password, setPassword ] = useState('')
  const [ firstName, setFirstName ] = useState('')
  const [ lastName, setLastName ] = useState('')
  const [ photo, setPhoto] = useState(null)
  const [ photoPreview, setPhotoPreview] = useState('https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y')
  const [ error, setError ] = useState('')
  const [ loading, setLoading ] = useState(false)

  const navigate = useNavigate()
  const { user, setUser } = useContext(UserDataContext)

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

      // Create the data object first
      const data = {
        fullname: {
          firstname: firstName.trim(),
          lastname: lastName.trim() || undefined
        },
        email: email.trim().toLowerCase(),
        password: password
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

      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/users/register`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        withCredentials: true
      })

      if (response.status === 201) {
        const data = response.data
        setUser(data.user)
        localStorage.setItem('token', data.token)
        navigate('/home')
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
    setPhoto(null)
    setPhotoPreview('https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y')
  }

  return (
    <div>
      <div className='p-7 h-screen flex flex-col justify-between'>
        <div>
          <img className='w-16 mb-10' src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYQy-OIkA6In0fTvVwZADPmFFibjmszu2A0g&s" alt="" />

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

            <h3 className='text-lg w-1/2  font-medium mb-2'>What's your name</h3>
            <div className='flex gap-4 mb-7'>
              <input
                required
                className='bg-[#eeeeee] w-1/2 rounded-lg px-4 py-2 border  text-lg placeholder:text-base'
                type="text"
                placeholder='First name'
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value)
                }}
              />
              <input
                className='bg-[#eeeeee] w-1/2  rounded-lg px-4 py-2 border  text-lg placeholder:text-base'
                type="text"
                placeholder='Last name'
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value)
                }}
              />
            </div>

            <h3 className='text-lg font-medium mb-2'>What's your email</h3>
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

            <h3 className='text-lg font-medium mb-2'>Enter Password</h3>

            <input
              className='bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg placeholder:text-base'
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
              }}
              required type="password"
              placeholder='password'
            />

            <button
              disabled={loading}
              className={`bg-[#111] text-white font-semibold mb-3 rounded-lg px-4 py-2 w-full text-lg placeholder:text-base ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>

          </form>
          <p className='text-center'>Already have a account? <Link to='/login' className='text-blue-600'>Login here</Link></p>
        </div>
        <div>
          <p className='text-[10px] leading-tight'>This site is protected by reCAPTCHA and the <span className='underline'>Google Privacy
            Policy</span> and <span className='underline'>Terms of Service apply</span>.</p>
        </div>
      </div>
    </div >
  )
}

export default UserSignup