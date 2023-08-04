import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi'
import { truncate } from './address'
import copyToClipboard from 'copy-to-clipboard'
import { getWalletConfigById } from '../contexts/connections'
import { WalletIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/20/solid';

export const ConnectButtonEthereum = () => {
  const [copied, setCopied] = useState(false);
  const [accountName, setAccountName] = useState(`Ethereum Wallet`);
  const [walletConfig, setWalletConfig] = useState();
  const [walletId, setWalletId] = useState();
  const rootAccount = useAccount({
    onDisconnect() {
      setWalletId()
      setAccountName()
      setWalletConfig()
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
    const wc = getWalletConfigById(walletId)
    const an = wc?.name ? `${wc?.name}` : `Ethereum Wallet`
    setAccountName(an)
    setWalletConfig(wc)
  }, [walletId])

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;
        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    className="rounded-lg px-2 min-w-[200px] bg-pink-600 w-full hover:bg-pink-600/80 ease-in-out transition duration-75 inline-flex justify-center items-center py-2.5 text-sm font-medium text-white"
                    onClick={openConnectModal}
                  >
                    <WalletIcon className="flex-shrink-0 w-5 h-5 mr-2 text-white" />
                    Add Ethereum Wallet
                  </button>
                );
              }
              if (chain.unsupported) {
                return (
                  <button
                    className="rounded-lg px-2 min-w-[200px] bg-pink-600 w-full hover:bg-pink-600/80 ease-in-out transition duration-75 inline-flex justify-center items-center py-2.5 text-sm font-medium text-white"
                    onClick={openChainModal}
                  >
                    Wrong network
                  </button>
                );
              }
              return (
                <div className="flex justify-between gap-x-6 py-2">
                  <div className="flex min-w-0 gap-x-4">
                    <div className="relative rounded-md bg-slate-800 w-12 h-12">
                      {walletConfig && walletConfig.logoUrl && (
                        <Image className="w-12 h-12 flex-none rounded-lg bg-gray-800" src={walletConfig.logoUrl} alt={walletConfig.name} width="48px" height="48px" />
                      )}
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
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
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 12, height: 12 }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-auto my-auto">
                      <p className="text-sm font-semibold leading-4 text-white">{accountName || account.displayName}</p>
                      <p className="truncate text-xs text-gray-400 leading-5 mt-1">{truncate(account.address, 16)}</p>
                    </div>
                  </div>
                  <div className="hidden shrink-0 sm:flex sm:items-end my-auto gap-2">
                    <div>
                      <button className="block h-7 w-7 cursor-pointer rounded p-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 text-black hover:bg-zinc-200 dark:text-white dark:hover:bg-zinc-900" onClick={(e) => {
                        e.preventDefault();
                        copyToClipboard(account.address || '');
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
                      <button title="Disconnect" className="block h-7 w-7 cursor-pointer rounded p-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 text-black hover:bg-zinc-200 dark:text-white dark:hover:bg-zinc-900" onClick={openAccountModal}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};