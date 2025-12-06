import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => (
  <div
    className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${
      hover ? 'hover:shadow-soft transition-shadow duration-300' : ''
    } ${className}`}
  >
    {children}
  </div>
);

export default Card;
