import React from 'react';
import Link from 'next/link';
import { NavProps, ActiveLink } from '../components';
import { ProfileWallet } from '../components/profile-wallet';

export const navItems: NavProps[] = [
  {
    // The only way to move NFTs is to have some to move...
    title: 'My NFTs',
    href: '/my-nfts'
  },
  {
    // For bridging (launching) a collection on another chain, provisioning the channel/connections for a classId
    title: 'Tools',
    href: '/tools'
  },
];

export const Header = () => {

  return (
    <header className="sticky top-0 z-50 px-8 hidden h-24 w-full max-w-full bg-black border-b border-black/10 border-zinc-800 lg:flex lg:flex-row lg:items-center lg:justify-between">
      <div className="flex">
        <Link href="/">
          <div className="flex items-center transition-transform focus:scale-110 focus:outline-0 focus:drop-shadow-primary">
            <img src="/ASTRAL_LOGO.svg" alt="ASTRAL" width="160" height="24" />
          </div>
        </Link>

        <nav className="flex flex-row space-x-4 px-2 py-6 ml-4 bg-black">
          {navItems.map((item, idx) => (
            <div key={idx}>
              <ActiveLink
                href={item.href}
                className="text-zinc-500 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-900 hover:text-primary group flex items-center rounded-md px-2 py-2.5 text-sm font-medium transition duration-100 ease-in-out xl:px-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500"
                activeClassName="hover:bg-zinc-200 dark:hover:bg-pink-600/80 hover:text-primary group flex items-center rounded-md px-2 py-2.5 text-sm font-medium transition duration-100 ease-in-out xl:px-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 bg-pink-600 text-white"
              >
                <div className="flex gap-2">
                  <span className="flex flex-none flex-row items-center transition duration-100">{item.title}</span>
                </div>
              </ActiveLink>
            </div>
          ))}
        </nav>
      </div>

      <ProfileWallet />
    </header>
  );
}
