/* eslint-disable @next/next/no-img-element */
import { Square2StackIcon, CheckIcon } from '@heroicons/react/20/solid';
import copyToClipboard from 'copy-to-clipboard';
import { useState, useCallback } from 'react';
import { useNameService } from '@cosmos-kit/react';

export function truncate(address: string, length: number = 12) {
  return `${address.substring(0, length)}…${address.substring(
    address.length - (length - 4),
    address.length
  )}`;
}

export default function AliasAddress({ children: address, len }: { children: string, len?: number }) {
  const [copied, setCopied] = useState<boolean>(false);
  const [resolvedName, setResolvedName] = useState<string | undefined>();

  const resolve = async () => {
    // TODO: finish
    // const nsName = `${address}`.search('stars') > -1 ? 'stargaze' : 'icns'
    // const ns = useNameService(nsName)
    // const res = await ns.data?.resolveName(address)
    // console.log('resolveName res', res)
    // setResolvedName()
  }

  // useCallback(resolve, [address])

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
      <p>{truncate(address || '', len)}</p>
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
