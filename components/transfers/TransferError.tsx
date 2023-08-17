/* eslint-disable @next/next/no-img-element */
import { Dialog } from '@headlessui/react'
import type { Dispatch } from './TransferModal'
import NftImage from '../nft-image'
import {
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {
  classNames,
} from '../../config'

export interface TransferErrorsTypes {
  setOpen: Dispatch <boolean>
  setReset: Dispatch <any>
  startSelfRelay: Dispatch <any>
  imageUrl?: string
  errors: any[]
  canSelfRelay?: boolean
}

export default function TransferError({
  setOpen,
  setReset,
  startSelfRelay,
  imageUrl,
  errors,
  canSelfRelay,
}: TransferErrorsTypes) {
  return (
    <div className="relative mt-0 text-left sm:mt-0 text-white">
      <Dialog.Title as="div" className="text-2xl font-semibold leading-6 text-gray-100">
        Transfer Error

        <div className="mt-2">
          <p className="text-sm text-gray-500">
            Something went wrong with your transfer. Please review the reasons below.
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

      <div className="flex justify-start gap-16 relative mx-auto mt-8">
        <NftImage className="min-h-[250px] min-w-[250px]" uri={imageUrl} />

        <div className="my-auto">
          <nav aria-label="Progress">
            <ul role="list" className="overflow-hidden pointer-events-none text-red-600">
              {errors && errors.map((item, idx) => (
                <li key={idx} className={classNames(idx > 1 ? 'pb-10' : '', 'relative')}>
                  <p>{idx + 1}. {`${item}`}</p>
                </li>
              ))}
              {!errors.length && (
                <li>
                  <p>Error could not be parsed correctly. Please try again.</p>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>

      <div className="mt-12 sm:mt-6 md:mt-12 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-4">
        {canSelfRelay && (
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-md bg-pink-600 hover:bg-pink-600/80 px-8 py-4 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 sm:col-start-2"
            onClick={() => startSelfRelay()}
          >
            Start Self-Relay
          </button>
        )}
        {!canSelfRelay && (
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-md bg-pink-600 hover:bg-pink-600/80 px-8 py-4 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 sm:col-start-2"
            onClick={() => setReset()}
          >
            Try Again
          </button>
        )}
        <button
          type="button"
          className="mt-3 inline-flex w-full justify-center rounded-md bg-transparent opacity-70 hover:opacity-95 px-8 py-4 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 sm:col-start-1 sm:mt-0"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>

    </div>
  )
}
