
import React from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME, APP_SUBTITLE, LOGO_URL } from '../../constants';

const Header: React.FC = () => {
  return (
    <header className="mb-6">
      <Link to="/" className="flex flex-col items-center text-center">
        <div className="w-24 h-24 mb-3 rounded-full border-4 border-[#dc143c] overflow-hidden shadow-lg bg-white">
          <img src={LOGO_URL} alt="Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-2xl font-black text-white drop-shadow-md tracking-tight">{APP_NAME}</h1>
        <p className="text-[10px] uppercase font-bold text-white/80 tracking-widest mt-1">
          {APP_SUBTITLE}
        </p>
      </Link>
    </header>
  );
};

export default Header;
