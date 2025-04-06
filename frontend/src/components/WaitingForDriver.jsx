import React, { useState, useEffect } from 'react'

const WaitingForDriver = (props) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.log('WaitingForDriver props:', props);
    if (props.ride?.otp) {
      console.log('OTP received:', props.ride.otp);
    }
  }, [props.ride]);

  const copyOTP = () => {
    if (props.ride?.otp) {
      navigator.clipboard.writeText(props.ride.otp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!props.ride) {
    return (
      <div className="p-4 text-center">
        <p>Loading ride details...</p>
      </div>
    );
  }

  return (
    <div>
      <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
        props.setWaitingForDriver(false)
      }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>

      <div className='flex items-center justify-between'>
        <img className='h-12' src="https://swyft.pl/wp-content/uploads/2023/05/how-many-people-can-a-uberx-take.jpg" alt="" />
        <div className='text-right'>
          <h2 className='text-lg font-medium capitalize'>{props.ride?.captain?.fullname?.firstname || 'Captain'}</h2>
          <h4 className='text-xl font-semibold -mt-1 -mb-1'>{props.ride?.captain?.vehicle?.plate || 'Loading...'}</h4>
          <p className='text-sm text-gray-600'>{props.ride?.captain?.vehicle?.vehicleType || 'Vehicle'}</p>
        </div>
      </div>

      {/* OTP Section */}
      <div className='mt-4 p-4 bg-gray-100 rounded-lg'>
        <div className='flex justify-between items-center'>
          <div>
            <p className='text-sm text-gray-600 mb-1'>Your OTP</p>
            <h1 className='text-4xl font-bold font-mono'>{props.ride?.otp || 'Loading...'}</h1>
          </div>
          <button 
            onClick={copyOTP}
            disabled={!props.ride?.otp}
            className='px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50'
          >
            {copied ? 'Copied!' : 'Copy OTP'}
          </button>
        </div>
        <p className='text-xs text-gray-500 mt-2'>Share this OTP with your captain when they arrive</p>
      </div>

      <div className='flex gap-2 justify-between flex-col items-center'>
        <div className='w-full mt-5'>
          <div className='flex items-center gap-5 p-3 border-b-2'>
            <i className="ri-map-pin-user-fill"></i>
            <div>
              <h3 className='text-lg font-medium'>Pickup</h3>
              <p className='text-sm -mt-1 text-gray-600'>{props.ride?.pickup || 'Loading...'}</p>
            </div>
          </div>
          <div className='flex items-center gap-5 p-3 border-b-2'>
            <i className="text-lg ri-map-pin-2-fill"></i>
            <div>
              <h3 className='text-lg font-medium'>Destination</h3>
              <p className='text-sm -mt-1 text-gray-600'>{props.ride?.destination || 'Loading...'}</p>
            </div>
          </div>
          <div className='flex items-center gap-5 p-3'>
            <i className="ri-currency-line"></i>
            <div>
              <h3 className='text-lg font-medium'>₹{props.ride?.fare || '0'}</h3>
              <p className='text-sm -mt-1 text-gray-600'>Cash Payment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WaitingForDriver