/* eslint-disable react-hooks/exhaustive-deps */
import Link from 'next/link';
import { MouseEventHandler, useEffect, useMemo, useState } from 'react';
import { ChainCard } from '../components';
import { Address, truncate } from './react/views';
import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  WalletIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { getWalletConfigById } from '../contexts/connections'
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import copyToClipboard from 'copy-to-clipboard';
import { useChain } from '@cosmos-kit/react';
import { useAccount } from 'wagmi'
import { WalletStatus } from '@cosmos-kit/core';
import { chainName } from '../config';

const buttons = {
  Disconnected: {
    icon: WalletIcon,
    title: 'Connect',
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

export const ProfileWallet = () => {
  const [wallets, setWallets] = useState({});
  const [walletConfig, setWalletConfig] = useState();
  const [walletId, setWalletId] = useState();
  const rootAccount = useAccount({
    onDisconnect() {
      setWalletId()
      setWalletConfig()
      setWallets()
    }
  })

  const getMeta = async () => {
    if (!rootAccount || !rootAccount.connector) return;
    if (!rootAccount.connector.id) return;
    let walletId = `${rootAccount.connector?.id || ''}`.toLowerCase().replace(/ /g, '')
    const { signer } = await rootAccount.connector?.getProvider()
    if (signer) {
      const meta = signer.client.pairing.values[0].peerMetadata
      walletId = `${meta?.name || walletId}`.toLowerCase().replace(/ /g, '')
    }
    if (walletId === '🌈 rainbow') walletId = 'rainbowwallet'
    setWalletId(walletId)
  }

  useEffect(() => {
    getMeta()
  }, [rootAccount])

  useEffect(() => {
    if (!walletId) return
    const wc = getWalletConfigById(walletId)
    setWalletConfig(wc)
    setWallets(prev => {
      const p = { ...prev }
      p[walletId] = wc
      return p
    })
  }, [walletId])

  const { wallet } = useChain(chainName);

  useEffect(() => {
    if (wallet) setWallets(prev => {
      const p = { ...prev }
      p.cosmos = wallet
      return p
    })
  }, [wallet])

  const walletLogos = useMemo(() => {
    return Object.keys(wallets).length > 0 && (
      Object.values(wallets).map((w, idx) => {
        const logo = w?.logo || w?.logoUrl
        if (!logo) return
        return (
          <img
            key={idx}
            className="relative inline-block h-4 w-4 rounded ring-2 ring-black"
            src={logo}
            alt={w.name}
          />
        )
      })
    )
  }, [wallets])

  return (
    <div className="">
      {Object.keys(wallets).length > 0 && (
        <Link href="/manage">
          <div className="group transition-all min-w-[160px] py-1 border-black/10 hover:border-black/50 dark:border-zinc-800 hover:dark:border-zinc-700 flex cursor-pointer flex-row items-center justify-between border lg:rounded-lg">
            <div className="flex px-4 py-2">
              <div className="isolate flex transition-all -space-x-[2px] group-hover:space-x-1 overflow-hidden my-auto mr-2">
                {walletLogos}
              </div>
              <p className="text-xs leading-6 my-auto">Active Wallet{Object.keys(wallets).length != 1 ? `s` : ``}</p>
            </div>
            <div className="flex pr-2">
              <ChevronDownIcon className="w-6 h-6" />
            </div>
          </div>
        </Link>
      )}

      {!Object.keys(wallets).length && (
        <Link href="/manage">
          <div className="cursor-pointer rounded-lg px-2 min-w-[200px] bg-pink-600 w-full hover:bg-pink-600/80 ease-in-out transition duration-75 inline-flex justify-center items-center py-2.5 text-sm font-medium text-white">
            <WalletIcon className="flex-shrink-0 w-5 h-5 mr-2 text-white" />
            Connect Wallets
          </div>
        </Link>
      )}

    </div>
  );
};
