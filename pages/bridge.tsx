import { useState, useEffect } from "react";
import { useChain } from '@cosmos-kit/react';
import { Order } from "cosmjs-types/ibc/core/channel/v1/channel";
import { createIbcConnectionAndChannel } from '../contexts/ibc'

// TODO: Move to env!
const bridgeRegistry = {
  juno: {
    bridge: 'juno1cnhz9cm08mgww2t3szzvu769jny4r8p023q9y95y0a08d0cldwjq923sd7',
  },
  neutron: {
    bridge: '',
  },
  stargaze: {
    bridge: 'stars1j0qr88wnfu934cqptkkrpf3rx6q0xj9cxr30cvazdfmcmj0h2a9s02ylaz',
  },
}

export default function Bridge() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasData, setHasData] = useState(false);

  // TODO: Change to dynamic!!
  const aContractAddress = bridgeRegistry.stargaze.bridge
  const bContractAddress = bridgeRegistry.juno.bridge

  const setupIbcNftChannel = async () => {
    try {
      const chainA = useChain('stargazetestnet');
      const chainB = useChain('junotestnet');
      console.log('chainA', chainA);
      console.log('chainB', chainB);
      
      const aSignerClient = ''
      const aOfflineClient = ''
      const bSignerClient = ''
      const bOfflineClient = ''
      // const cosmWasmClient = await getCosmWasmClient();
      // console.log('cosmWasmClient', cosmWasmClient);
      // const signerCosmWasmClient = await getSigningCosmWasmClient();
      // console.log('signerCosmWasmClient', signerCosmWasmClient);
      // const offlineSignerCosmWasmClient = await getOfflineSigner();
      // console.log('offlineSignerCosmWasmClient', offlineSignerCosmWasmClient);

      // const channelInfo = await createIbcConnectionAndChannel(
      //   aSignerClient,
      //   aOfflineClient,
      //   aContractAddress,
      //   bSignerClient,
      //   bOfflineClient,
      //   bContractAddress,
      //   Order.ORDER_UNORDERED,
      //   "ics721-1"
      // );

      // console.log('channelInfo', channelInfo)
    } catch (e) {
      console.log('e', e)
    }
  }

  return (
    <div>
      <div className="text-center pt-16">
        <h1 className="mb-6 text-center text-3xl font-semibold xl:text-5xl">
          Bridge A collection
        </h1>
        <p>Coming soon!</p>
      </div>

    </div>
  );
}
