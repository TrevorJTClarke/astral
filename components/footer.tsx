import React from 'react';

export const Footer = () => {
  return (
    <footer className="flex justify-center py-6 text-sm text-center">
      <span className="flex flex-row items-center space-x-2">
        <p>Built with ☕️ -</p>
        <a
          href="https://github.com/ravichain"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ravi
        </a>
      </span>
    </footer>
  );
}
