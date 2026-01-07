
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center">
      <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl shadow-lg mb-4">
        <i className="fa-solid fa-microphone-lines text-white text-3xl"></i>
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
        Global<span className="text-indigo-600">Accent</span>
      </h1>
      <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
        Inclusive speech-to-text designed for Nigerian, Indian, Caribbean, and all global English accents.
      </p>
    </header>
  );
};

export default Header;
