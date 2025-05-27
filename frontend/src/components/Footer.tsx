import React from 'react';

const Footer = () => (
  <footer className="bg-gradient-to-r from-[#E5DEFF] via-[#F1F0FB] to-[#D3E4FD] text-gray-600 text-center py-4 mt-8 shadow-inner backdrop-blur-sm">
    &copy; {new Date().getFullYear()} Smart Document Classifier. All rights reserved.
  </footer>
);

export default Footer; 