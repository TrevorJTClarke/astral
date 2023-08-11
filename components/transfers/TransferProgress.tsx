/* eslint-disable @next/next/no-img-element */
import { Dialog } from '@headlessui/react'
import NftLoader from '../nft-loader'
import type { Dispatch } from './TransferModal'
import {
  XMarkIcon,
} from '@heroicons/react/24/outline'

export interface TransferProgressTypes {
  setOpen: Dispatch<boolean>
  currentSteps: any[]
  imageUrl?: string
}

export default function TransferProgress({
  setOpen,
  imageUrl,
  currentSteps,
}: TransferProgressTypes) {
  console.log('TransferProgress currentSteps', currentSteps);
  
  return (
    <div className="relative mt-0 text-left sm:mt-0">
      <Dialog.Title as="div" className="text-2xl animate-pulse font-semibold leading-6 text-gray-100">
        Transfering...

        <div className="mt-2">
          <p className="text-sm text-gray-500">
            Please be patient while your NFT travels across the interchain...
          </p>
        </div>
      </Dialog.Title>

      <button
        type="button"
        className="absolute top-0 right-0 bg-transparent opacity-0 hover:opacity-100 hover:bg-gray-800 px-4 py-3 rounded-xl"
        onClick={() => setOpen(false)}
      >
        <XMarkIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
      </button>

      <div className="relative mx-auto mt-8 text-center text-white">
        <NftLoader uri={imageUrl} />

        <nav className="flex flex-col items-center justify-center" aria-label="Progress">
          <ol role="list" className="mb-4 flex items-center space-x-5 pointer-events-none">
            {currentSteps.map((step) => (
              <li key={step.name}>
                {step.status === 'complete' ? (
                  <a href={step.href} className="block h-2.5 w-2.5 rounded-full bg-pink-600 hover:bg-pink-900">
                    <span className="sr-only">{step.name}</span>
                  </a>
                ) : step.status === 'current' ? (
                  <a href={step.href} className="relative flex items-center justify-center" aria-current="step">
                    <span className="absolute flex h-5 w-5 p-px" aria-hidden="true">
                      <span className="h-full w-full rounded-full bg-pink-900/60" />
                    </span>
                    <span className="relative block h-2.5 w-2.5 rounded-full bg-pink-600" aria-hidden="true" />
                    <span className="sr-only">{step.name}</span>
                  </a>
                ) : (
                  <a href={step.href} className="block h-2.5 w-2.5 rounded-full bg-gray-800 hover:bg-gray-600">
                    <span className="sr-only">{step.name}</span>
                  </a>
                )}
              </li>
            ))}
          </ol>
          <p className="text-sm text-gray-500 font-medium animate-pulse">
            {currentSteps[currentSteps.findIndex((step) => step.status === 'current')].name}
          </p>
        </nav>
      </div>

    </div>
  )
}
