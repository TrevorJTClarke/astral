/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { Fragment, useState, useMemo, useEffect } from 'react';
import { Chain } from '@chain-registry/types';
import { Dialog, Transition } from '@headlessui/react'
import { NFTChannel, } from '../../contexts/connections'
import TransferError from './TransferError';
import TransferForm from './TransferForm';
import TransferProgress from './TransferProgress';
import TransferSelfRelay from './TransferSelfRelay';
import TransferSuccess from './TransferSuccess';

export declare type Dispatch<T> = (value?: T) => void;

export interface TransferModalTypes {
  isOpen: boolean
  setOpen: Dispatch<boolean>
  imageUrl?: string
}

export enum TransferView {
  Error,
  TransferForm,
  Progress,
  Success,
  SelfRelay,
}

export function TransferModal({
  isOpen,
  setOpen,
  imageUrl,
}: TransferModalTypes) {
  const [currentView, setCurrentView] = useState<TransferView>(TransferView.TransferForm)
  const [srcNetwork, setSrcNetwork] = useState<Chain | undefined>()
  const [destNetwork, setDestNetwork] = useState<Chain | undefined>()
  const [selectedChannel, setSelectedChannel] = useState<NFTChannel | undefined>()
  const [errors, setErrors] = useState([])
  const [successMeta, setSuccessMeta] = useState({})
  const [canSelfRelay, setCanSelfRelay] = useState(false)

  const setReset = () => {
    setCurrentView(TransferView.TransferForm)
    setErrors([])
  }
  const startSelfRelay = () => {
    console.log('startSelfRelay TODO:')
    setCurrentView(TransferView.SelfRelay)
    setErrors([])
  }
  const checkAndSetView = (data) => {
    if (typeof data.view !== 'undefined') setCurrentView(data.view)
  }
  const onSuccessForm = (data: any) => {
    checkAndSetView(data)
    setSuccessMeta(data)
  }
  const onErrorForm = (data: any) => {
    checkAndSetView(data)
    if (data.srcNetwork) setSrcNetwork(data.srcNetwork)
    if (data.destNetwork) setDestNetwork(data.destNetwork)
    if (data.selectedChannel) setSelectedChannel(data.selectedChannel)
    if (data.canSelfRelay) setCanSelfRelay(data.canSelfRelay)
    if (data.errors) setErrors(data.errors)
  }
  const onSuccessRelay = (data: any) => {
    checkAndSetView(data)
    setSuccessMeta(data)
  }
  const onErrorRelay = (data: any) => {
    checkAndSetView(data)
    if (data.errors) setErrors(data.errors)
  }

  useEffect(() => {
    if (!isOpen) {
      // delay so UI transition doesnt get weird
      setTimeout(() => {
        setCurrentView(TransferView.TransferForm)
      }, 1000)
    }
  }, [isOpen]);

  const _render = useMemo(() => {
    switch (currentView) {
      case TransferView.Error:
        return (
          <TransferError
            setOpen={setOpen}
            setReset={setReset}
            startSelfRelay={startSelfRelay}
            imageUrl={imageUrl}
            errors={errors}
            canSelfRelay={canSelfRelay}
          />
        );
      case TransferView.TransferForm:
        return (
          <TransferForm
            setOpen={setOpen}
            onSuccess={onSuccessForm}
            onError={onErrorForm}
            imageUrl={imageUrl}
          />
        );
      case TransferView.Progress:
        return (
          <TransferProgress setOpen={setOpen} imageUrl={imageUrl} currentSteps={[]} />
        );
      case TransferView.Success:
        return (
          <TransferSuccess setOpen={setOpen} imageUrl={imageUrl} data={successMeta} />
        );
      case TransferView.SelfRelay:
        return (
          <TransferSelfRelay
            setOpen={setOpen}
            onSuccess={onSuccessRelay}
            onError={onErrorRelay}
            imageUrl={imageUrl}
            srcNetwork={srcNetwork}
            destNetwork={destNetwork}
            selectedChannel={selectedChannel}
          />
        );
    }
  }, [currentView, imageUrl]);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-zinc-800/75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-0 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-xl bg-black p-8 [min-height:18rem] text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg md:max-w-3xl">
                <div className="w-full h-full">{_render}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
