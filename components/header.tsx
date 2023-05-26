import React from 'react';
import { useTheme } from '../contexts/theme';
import { WalletSection, NavProps } from '../components';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

export const navItems: NavProps[] = [
  {
    title: 'My NFTs',
    href: '/my-nfts'
  },
  {
    title: 'Bridge',
    href: '/bridge'
  },
  {
    title: 'Launch',
    href: '/launch'
  },
];

const useReactPath = () => {
  if (typeof window === "undefined") return '';
  const [path, setPath] = React.useState(window.location.pathname);
  const listenToPopstate = () => {
    const winPath = window.location.pathname;
    setPath(winPath);
  };
  React.useEffect(() => {
    window.addEventListener("popstate", listenToPopstate);
    return () => {
      window.removeEventListener("popstate", listenToPopstate);
    };
  }, []);
  return path;
};

export const Header = () => {
  const { theme, toggleTheme } = useTheme();
  // const path = useReactPath();
  // React.useEffect(() => {
  //   // do something when path changes ...
  //   console.log('path', path)
  // }, [path]);

  return (
    <header className="sticky top-0 z-50 px-8 hidden h-24 w-full max-w-full bg-white border-b border-black/10 dark:border-zinc-800 dark:bg-black lg:flex lg:flex-row lg:items-center lg:justify-between">
      <div className="flex">
        <a className="flex items-center transition-transform focus:scale-110 focus:outline-0 focus:drop-shadow-primary" href="/">
          <img src="/stargaze.svg" alt="Stargaze" width="124" height="30" />
        </a>

        <nav className="flex flex-row space-x-4 bg-white px-2 py-6 ml-4 dark:bg-black">
          {navItems.map((item, idx) => (
            <div key={idx}>
              <a title={item.title} href={item.href} target=""
                // className={path === item.href
                className={false
                  ? 'hover:bg-zinc-200 dark:hover:bg-pink-600/80 hover:text-primary group flex items-center rounded-md px-2 py-2.5 text-sm font-medium transition duration-100 ease-in-out xl:px-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 bg-pink-600 text-white'
                  : 'text-zinc-500 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-900 hover:text-primary group flex items-center rounded-md px-2 py-2.5 text-sm font-medium transition duration-100 ease-in-out xl:px-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500'}>
                <div className="flex gap-2">
                  <span className="flex flex-none flex-row items-center transition duration-100">{item.title}</span>
                </div>
              </a>
            </div>
          ))}
        </nav>
      </div>

      <WalletSection />
      {/* <button
        className="inline-flex items-center justify-center w-12 h-12 text-black border rounded-lg dark:text-white hover:bg-black/10 dark:hover:bg-white/10 border-black/10 dark:border-white/10"
        onClick={toggleTheme}
      >
        {theme === 'light' ? (
          <MoonIcon className="w-5 h-5" />
        ) : (
          <SunIcon className="w-6 h-6" />
        )}
      </button> */}
    </header>
  );
}
