/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo, useState } from 'react';
import { truncate } from './react/views';
import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  WalletIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/20/solid';
import copyToClipboard from 'copy-to-clipboard';
import { useChain } from '@cosmos-kit/react';
import { WalletStatus } from '@cosmos-kit/core';
import { chainName } from '../config';

const buttons = {
  Disconnected: {
    icon: WalletIcon,
    title: 'Add Cosmos Wallet',
  },
  Connected: {
    icon: WalletIcon,
    title: 'My Wallet',
  },
  Rejected: {
    icon: ArrowPathIcon,
    title: 'Reconnect',
  },
  Error: {
    icon: ArrowPathIcon,
    title: 'Change Wallet',
  },
  NotExist: {
    icon: ArrowDownTrayIcon,
    title: 'Install Wallet',
  },
};

export const ConnectButtonCosmos = () => {
  const {
    connect,
    disconnect,
    openView,
    status,
    username,
    address,
    chain: chainInfo,
    logoUrl,
    wallet,
  } = useChain(chainName);

  const chain = {
    chainName,
    label: chainInfo.pretty_name,
    value: chainName,
    icon: logoUrl,
  };

  const [copied, setCopied] = useState(false);

  // Events
  const onClickConnect = async (e) => {
    e.preventDefault();
    await connect();
  };

  const onClickOpenView = (e) => {
    e.preventDefault();
    openView();
  };

  const _renderConnectButton = useMemo(() => {
    // Spinner
    if (status === WalletStatus.Connecting) {
      return (
        <button className="rounded-lg w-full bg-purple-damp hover:bg-purple-damp/75 inline-flex justify-center items-center py-2.5 font-medium cursor-wait text-white">
          <svg
            className="w-5 h-5 text-white animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </button>
      );
    }

    let onClick;
    if (
      status === WalletStatus.Disconnected ||
      status === WalletStatus.Rejected
    )
      onClick = onClickConnect;
    else onClick = onClickOpenView;

    const buttonData = buttons[status];

    return (
      <button
        className="rounded-lg px-2 min-w-[200px] bg-pink-600 w-full hover:bg-pink-600/80 ease-in-out transition duration-75 inline-flex justify-center items-center py-2.5 text-sm font-medium text-white"
        onClick={onClick}
      >
        <buttonData.icon className="flex-shrink-0 w-5 h-5 mr-2 text-white" />
        {buttonData.title}
      </button>
    );
  }, [onClickConnect, onClickOpenView, status]);

  return (
    <div className="">

      {username && (
        <div className="flex flex-row items-center justify-between">
          <div className="flex gap-x-4">
            <div className="relative rounded-md bg-slate-800 w-12 h-12">
              {wallet && wallet.logo && (
                <img className="w-12 h-12 flex-none rounded-lg bg-gray-800" src={wallet.logo} alt={wallet.name} width="48px" height="48px" />
              )}
              {chain.icon && (
                <div
                  style={{
                    background: 'black',
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    overflow: 'hidden',
                    // marginRight: 4,
                    position: 'absolute',
                    right: -2,
                    bottom: -1,
                  }}
                >
                  {chain.icon && (
                    <img
                      alt={chain.value ?? 'Chain icon'}
                      src={chain.icon}
                      style={{ width: 12, height: 12 }}
                    />
                  )}
                </div>
              )}
            </div>
            <div className="flex-auto my-auto">
              <p className="w-32 truncate text-xs font-medium">
                <span className="group inline-flex max-w-full items-center gap-2">
                  <span className="max-w-full">{username}</span>
                </span>
              </p>
              <p className="text-xs font-light">{truncate(address || '', 16)}</p>
            </div>
          </div>
          <div className="flex flex-row space-x-2">
            <div>
              <button className="block h-7 w-7 cursor-pointer rounded p-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 text-black hover:bg-zinc-200 dark:text-white dark:hover:bg-zinc-900" onClick={() => {
                copyToClipboard(address || '');
                setCopied(true);
                setTimeout(() => {
                  setCopied(false);
                }, 1500);
              }}>
                {copied ? (
                  <CheckIcon className="w-4 h-4 text-pink-300 dark:text-pink-300/90" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6"></path>
                  </svg>
                )}
              </button>
            </div>
            <div>
              <button title="Profile" className="block h-7 w-7 cursor-pointer rounded p-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 text-black hover:bg-zinc-200 dark:text-white dark:hover:bg-zinc-900" onClick={onClickOpenView}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {!username && (
        <div className="">
          {_renderConnectButton}
        </div>
      )}

    </div>
  );
};
