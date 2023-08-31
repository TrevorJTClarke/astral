/* eslint-disable @next/next/no-img-element */
import { useChain } from '@cosmos-kit/react';
import { Dialog } from '@headlessui/react';
import {
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { ChevronLeftIcon, CheckIcon } from '@heroicons/react/20/solid';
import copyToClipboard from 'copy-to-clipboard';
import { useState } from 'react';

export function truncate(address: string) {
  return `${address.substring(0, 12)}...${address.substring(
    address.length - 8,
    address.length
  )}`;
}

export const Address = ({ children: address }: { children: string }) => {
  const [copied, setCopied] = useState<boolean>(false);
  return (
    <button
      className="inline-flex items-center justify-center px-6 py-1 mx-4 mb-4 space-x-2 text-sm text-white/75"
      onClick={() => {
        copyToClipboard(address);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 1500);
      }}
    >
      <p>{truncate(address || '')}</p>
      {copied ? (
        <CheckIcon className="w-3 h-3 text-white/75" />
      ) : (
        <ClipboardDocumentIcon className="w-3 h-3 text-white/75" />
      )}
    </button>
  );
};

export const Connected = ({
  onClose,
  onReturn,
  disconnect,
  name,
  logo,
  username,
  address,
}: {
  onClose: () => void;
  onReturn: () => void;
  disconnect: () => void;
  name: string;
  logo: string;
  username?: string;
  address?: string;
}) => {
  return (
    <div className="flex flex-col w-full h-full text-center">
      <div className="flex flex-row items-center justify-between">
        <button
          type="button"
          className="p-2 rounded-full text-white bg-white/10 hover:scale-105"
          onClick={onReturn}
        >
          <span className="sr-only">Return</span>
          <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
        </button>
        <Dialog.Title
          as="h3"
          className="font-medium leading-6 text-center text-white"
        >
          {name}
        </Dialog.Title>
        <button
          type="button"
          className="p-2 rounded-full text-white bg-white/10 hover:scale-105"
          onClick={onClose}
        >
          <span className="sr-only">Close</span>
          <XMarkIcon className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
      <div className="flex flex-col justify-between h-full mt-12">
        <div className="flex flex-col justify-center my-auto">
          <div className="flex flex-row items-center mx-auto space-x-2">
            <img
              src={logo}
              alt={name}
              className="flex-shrink-0 w-4 h-4 mt-0 aspect-1"
            />
            <p className="mt-0 mb-0 text-lg font-medium text-white">
              {username || ''}
            </p>
          </div>
          <Address>{address || ''}</Address>
        </div>
        <button
          className="rounded-lg mt-12 bg-slate-600 hover:bg-slate-600/80 inline-flex justify-center items-center py-2.5 font-medium text-white"
          onClick={() => {
            disconnect();
            onClose();
          }}
        >
          <ArrowRightOnRectangleIcon className="flex-shrink-0 w-5 h-5 mr-2 text-white" />
          Disconnect
        </button>
      </div>
    </div>
  );
};
