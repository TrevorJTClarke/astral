/* eslint-disable @next/next/no-img-element */
import { useChain } from '@cosmos-kit/react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';

export const Error = ({
  onClose,
  onReturn,
  onReconnect,
  logo,
}: {
  onClose: () => void;
  onReturn: () => void;
  onReconnect: () => void;
  logo: string;
}) => {
  return (
    <div className="mt-3 text-center sm:mt-1.5">
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
          Error
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
      <div className="flex flex-col w-full h-full py-6 mt-4 sm:px-8">
        <div className="p-3 border rounded-full border-red-600 mx-auto aspect-1 flex-shrink-0">
          <img
            src={logo}
            alt="Wallet type logo"
            className="flex-shrink-0 w-16 h-16 aspect-1"
          />
        </div>
        <p className="mt-3 font-medium text-white">An error has occured</p>
        <button
          className="rounded-lg bg-pink-600 hover:bg-pink-600/80 inline-flex justify-center items-center py-2.5 font-medium mt-4 text-white"
          onClick={onReconnect}
        >
          <ArrowPathIcon className="flex-shrink-0 w-5 h-5 mr-2 text-white" />
          Reconnect
        </button>
      </div>
    </div>
  );
};
