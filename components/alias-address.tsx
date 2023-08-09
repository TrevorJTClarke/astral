/* eslint-disable @next/next/no-img-element */
import { Square2StackIcon, CheckIcon } from '@heroicons/react/20/solid';
import copyToClipboard from 'copy-to-clipboard';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useChain, useManager } from '@cosmos-kit/react';
import { getNameServiceRegistryFromName, NameService, State } from '@cosmos-kit/core';
import { useEnsName } from 'wagmi'
import {
  ethereummainnet,
} from '../config'

let resolvedCache = {}
let providerCache = {}

// Why not "useNameService"? Because it causes infinite RPC provider/cosmWasmClient bootstrapping... ugh
export const resolveCosmosNameService = async (manager, name, address) => {
  if (providerCache[name]) return providerCache[name].resolveName(address)
  const registry = getNameServiceRegistryFromName(name)
  if (!registry) throw new Error('No such name service: ' + name)
  const repo = manager.getWalletRepo(registry.chainName)
  const cosmWasmClient = await repo.getCosmWasmClient();
  if (!cosmWasmClient) throw new Error('No CosmWasmClient')
  const ns = new NameService(cosmWasmClient, registry)
  if (ns) providerCache[name] = ns
  return ns.resolveName(address)
};

export function truncate(address: string, length: number = 12) {
  return `${address.substring(0, length)}…${address.substring(
    address.length - (length - 4),
    address.length
  )}`;
}

export function ResolveEns({ address, len }) {
  const { data } = useEnsName({ address, cacheTime: 3 * 24 * 60 * 60 * 1000 })

  if (data) {
    resolvedCache[address] = data
  }
  
  return (
    <p title={address}>{resolvedCache[address] || truncate(address, len)}</p>
  )
}

export function ResolveCosmosNames({ address, len }) {
  const [resolvedName, setResolvedName] = useState(`${truncate(address, len)}`)
  const manager = useManager()

  const resolveCosmos = async () => {
    if (!address) return;
    if (resolvedCache[address]) return setResolvedName(resolvedCache[address])
    try {
      const nsName = `${address}`.search('stars') > -1 ? 'stargaze' : 'icns'
      const res = await resolveCosmosNameService(manager, nsName, address)
      if (!res) return
      // For ICNS
      let name
      if (res.names || res.primary_name) name =`${res.primary_name || res.names[0]}`
      else name = res // stargaze
      if (name) {
        resolvedCache[address] = name
        setResolvedName(name)
      }
    } catch (e) {
      // console.error(e)
    }
  }

  useEffect(() => {
    resolveCosmos()
  }, [address])

  return (
    <p title={address}>{resolvedName}</p>
  )
}

export default function AliasAddress({ children: address, len }: { children: string, len?: number }) {
  const [copied, setCopied] = useState<boolean>(false);
  const isEthereumAddress = address && address.startsWith(ethereummainnet.bech32_prefix)

  if (!address) return (
    <span className="rounded-sm bg-gray-700 opacity-20 w-10 h-5 animate-pulse"></span>
  )

  return (
    <button
      className="group inline-flex items-center justify-center px-0 py-0 space-x-2 text-sm text-pink-500 hover:text-pink-600"
      onClick={() => {
        copyToClipboard(address);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 1500);
      }}
    >
      {resolvedCache[address] && (
        <p title={address}>{resolvedCache[address]}</p>
      )}
      {isEthereumAddress && !resolvedCache[address] && (
        <ResolveEns address={address} len={len} />
      )}
      {!isEthereumAddress && !resolvedCache[address] && (
        <ResolveCosmosNames address={address} len={len} />
      )}
      
      <div aria-label="Copy" className="w-4 h-4 text-white group/button relative inline focus:outline-none">
      {copied ? (
        <CheckIcon className="w-4 h-4 text-gray-500 dark:text-white/75" />
      ) : (
        <Square2StackIcon className="w-4 h-4 text-white inline absolute inset-0 scale-0 opacity-0 transition group-hover:scale-100 group-hover:opacity-80 group-focus-visible/button:scale-110 group-focus-visible/button:opacity-100 group-hover/button:scale-110 group-active/button:scale-100" />
      )}
      </div>
    </button>
  );
};
