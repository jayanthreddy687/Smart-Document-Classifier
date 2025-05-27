import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => (
  <nav className="bg-gradient-to-r from-[#E5DEFF] via-[#F1F0FB] to-[#D3E4FD] py-4 px-8 flex items-center justify-between shadow-md backdrop-blur-sm">
    <div className="text-xl font-bold text-gray-700">
      <Link to="/">Smart Document Classifier</Link>
    </div>
    <div className="space-x-6">
      <Link to="/" className="text-gray-700 hover:text-indigo-700 font-medium">Home</Link>
      <a href="#Statistics" className="text-gray-700 hover:text-indigo-700 font-medium">Stats</a>
      <a href="#history" className="text-gray-700 hover:text-indigo-700 font-medium">Document History</a>
    </div>
  </nav>
);

export default Navbar; 