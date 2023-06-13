import { useState, useEffect } from "react";
import { useChain, useManager } from '@cosmos-kit/react';
import { Order } from "cosmjs-types/ibc/core/channel/v1/channel";
import {
  CosmWasmSigner,
} from "@confio/relayer/build/lib";
import { createIbcConnectionAndChannel, createIbcRelayLinkFromExisting } from '../contexts/ibc'
import { OfflineSigner } from "@cosmjs/proto-signing";

// TODO: Move to env!
const bridgeRegistry = {
  juno: {
    // cw_ics721_bridge_pr49: 2404
    bridge: 'juno17f8seg2s7vekzjf9u340krujcvyx3sqrj6ggcukhp9dyv64hhdxqkm4frn',
    chain_id: "uni-6",
    port: "wasm.juno17f8seg2s7vekzjf9u340krujcvyx3sqrj6ggcukhp9dyv64hhdxqkm4frn",
    channel: "channel-443",
    clientID: "07-tendermint-467",
    connection: "connection-484",
  },
  neutron: {
    bridge: '',
  },
  stargaze: {
    // cw_ics721_bridge_pr49: 2544 
    bridge: 'stars1qpl2xtwgrlnhg7c5f56tn8sgru53yxae8qx6zcxcz40fnfa9vk2sypwh0e',
    chain_id: "elgafar-1",
    port: "wasm.stars1qpl2xtwgrlnhg7c5f56tn8sgru53yxae8qx6zcxcz40fnfa9vk2sypwh0e",
    channel: "channel-468",
    clientID: "07-tendermint-420",
    connection: "connection-562",
  },
}

let init = false

const sgtn = 'stargazetestnet'
const sgid = 'elgafar-1'
const jntn = 'junotestnet'
const jnid = 'uni-6'

export default function Bridge() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasData, setHasData] = useState(false);

  // dynamic wallet/client connections
  const manager = useManager()

  // TODO: Change to dynamic!!
  const aContractAddress = bridgeRegistry.stargaze.bridge
  const bContractAddress = bridgeRegistry.juno.bridge

  const setupIbcNftChannel = async () => {
    if (init) return;
    init = true
    try {
      const chainA = useChain(sgtn);
      console.log('chainA', chainA);
      const chainB = useChain(jntn);
      console.log('chainB', chainB);
      const repoA = manager.getWalletRepo(sgtn)
      // if (repoA.isWalletDisconnected) await repoA.connect('stargazetestnet')
      // if (repoB.isWalletDisconnected) await repoB.connect('keplr-extension')
      console.log('repoA', repoA);
      const aSignerWallet = await repoA.getWallet('keplr-extension')
      const aSigner = await aSignerWallet.getSigningCosmWasmClient()
      const aSignerClient: CosmWasmSigner = {
        sign: aSigner,
        senderAddress: repoA.current?.address || '',
      }
      // const aOfflineClient: OfflineSigner = aSignerWallet.offlineSigner.keplr
      const aOfflineClient: OfflineSigner = aSignerWallet.offlineSigner.keplr.getOfflineSigner(sgid, 'direct')
      // if (!aOfflineClient.signDirect) aOfflineClient.signDirect = aOfflineClient.keplr.signDirect
      // const aOfflineClient: OfflineSigner = await aSignerWallet.initOfflineSigner()
      console.log('aOfflineClient', aOfflineClient);
      console.log('aSignerWallet', aSignerWallet);
      // if (!aOfflineClient.signDirect) aOfflineClient.signDirect = aOfflineClient.keplr.signDirect || aOfflineClient.sign
      console.log('aSignerClient', aSignerClient);
      console.log('aSignerClient IBC', aSigner);



      const repoB = manager.getWalletRepo(jntn)
      console.log('repoB', repoB);
      const bSignerWallet = await repoB.getWallet('keplr-extension')
      const bSigner = await bSignerWallet.getSigningCosmWasmClient()
      const bSignerClient: CosmWasmSigner = {
        sign: bSigner,
        senderAddress: repoB.current?.address || '',
      }
      // const bOfflineClient: OfflineSigner = bSignerWallet.offlineSigner
      const bOfflineClient: OfflineSigner = bSignerWallet.offlineSigner.keplr.getOfflineSigner(jnid, 'direct')
      if (!bOfflineClient.signDirect) bOfflineClient.signDirect = bOfflineClient.sign
      console.log('bSignerClient', bSignerClient);
      console.log('bOfflineClient', bOfflineClient);


      const channelInfo = await createIbcConnectionAndChannel(
        aSignerClient,
        aOfflineClient,
        aContractAddress,
        bSignerClient,
        bOfflineClient,
        bContractAddress,
        Order.ORDER_UNORDERED,
        "ics721-1" //
      );

      console.log('channelInfo', channelInfo)
    } catch (e) {
      console.log('e', e)
    }
  }

  const relayIbcNftTxns = async () => {
    if (init) return;
    init = true
    try {
      const chainA = useChain(sgtn);
      console.log('chainA', chainA);
      const chainB = useChain(jntn);
      console.log('chainB', chainB);
      const repoA = manager.getWalletRepo(sgtn)
      // if (repoA.isWalletDisconnected) await repoA.connect('stargazetestnet')
      // if (repoB.isWalletDisconnected) await repoB.connect('keplr-extension')
      console.log('repoA', repoA);
      const aSignerWallet = await repoA.getWallet('keplr-extension')
      const aSigner = await aSignerWallet.getSigningCosmWasmClient()
      const aSignerClient: CosmWasmSigner = {
        sign: aSigner,
        senderAddress: repoA.current?.address || '',
      }
      // const aOfflineClient: OfflineSigner = aSignerWallet.offlineSigner.keplr
      const aOfflineClient: OfflineSigner = aSignerWallet.offlineSigner.keplr.getOfflineSigner(sgid, 'direct')
      // if (!aOfflineClient.signDirect) aOfflineClient.signDirect = aOfflineClient.keplr.signDirect
      // const aOfflineClient: OfflineSigner = await aSignerWallet.initOfflineSigner()
      console.log('aOfflineClient', aOfflineClient);
      console.log('aSignerWallet', aSignerWallet);
      // if (!aOfflineClient.signDirect) aOfflineClient.signDirect = aOfflineClient.keplr.signDirect || aOfflineClient.sign
      console.log('aSignerClient', aSignerClient);
      console.log('aSignerClient IBC', aSigner);



      const repoB = manager.getWalletRepo(jntn)
      console.log('repoB', repoB);
      const bSignerWallet = await repoB.getWallet('keplr-extension')
      const bSigner = await bSignerWallet.getSigningCosmWasmClient()
      const bSignerClient: CosmWasmSigner = {
        sign: bSigner,
        senderAddress: repoB.current?.address || '',
      }
      // const bOfflineClient: OfflineSigner = bSignerWallet.offlineSigner
      const bOfflineClient: OfflineSigner = bSignerWallet.offlineSigner.keplr.getOfflineSigner(jnid, 'direct')
      if (!bOfflineClient.signDirect) bOfflineClient.signDirect = bOfflineClient.sign
      console.log('bSignerClient', bSignerClient);
      console.log('bOfflineClient', bOfflineClient);


      const link = await createIbcRelayLinkFromExisting(
        aSignerClient,
        aOfflineClient,
        // bridgeRegistry.stargaze.connection,
        // bridgeRegistry.stargaze.clientID,
        // bridgeRegistry.stargaze.channel,
        bridgeRegistry.juno.connection,
        bSignerClient,
        bOfflineClient,
        bridgeRegistry.stargaze.connection,
      );

      console.log('link', link)

      if (link?.relayAll) await link.relayAll()
      return link
    } catch (e) {
      console.log('e', e)
    }
  }

  // if (typeof window !== 'undefined') setupIbcNftChannel()
  if (typeof window !== 'undefined') relayIbcNftTxns()

  return (
    <div>
      <div className="text-center pt-16">
        <h1 className="mb-6 text-center text-3xl font-semibold xl:text-5xl">
          Bridge: Create IBC connection channels
        </h1>
        <p>Coming soon!</p>
      </div>

    </div>
  );
}
