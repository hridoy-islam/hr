import React from 'react';
import errorPage from '../../assets/imges/home/errorpage.png';
import { Link } from 'react-router-dom';

const ErrorPage = () => {
  return (
    <div className=" grid lg:grid-cols-2 grid-cols-1 gap-6 items-center w-10/12 mx-auto justify-around">
      <div>
        <img src={errorPage} alt="" className='w-full'/>
      </div>
      <div className='ml-5'>
        <h1 className='text-5xl font-bold mb-10 '> PAGE <br />  NOT FOUND</h1>
        <Link to="/" className='bg-supperagent px-5 py-3 rounded-2xl font-bold text-white'>Back To Home</Link>
      </div>
    </div>
  );
};

export default ErrorPage;
