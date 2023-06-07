import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { toBase64, toUtf8 } from "@cosmjs/encoding";

export interface IBCTransferMsg {
  receiver: string
  channel_id: string
  timeout: {
    block: {
      revision: number
      height: number
    }
  }
}

export interface ICS721SendNFT {
  send_nft: {
    contract: string
    token_id: string
    msg: string
  }
}

export interface MsgSendIcsOptions {
  channel_id: string
  contract: string
  token_id: string
  receiver: string
}

export async function getMsgSendIcsNft(client: CosmWasmClient, options: MsgSendIcsOptions): Promise<ICS721SendNFT> {
  // TODO: Get current height on sending client chain

  const ibcTransferMsg: IBCTransferMsg = {
    receiver: options.receiver,
    channel_id: options.channel_id,
    timeout: {
      block: {
        revision: 1,
        height: 0
      }
    }
  }

  return {
    send_nft: {
      contract: options.contract,
      token_id: options.token_id,
      msg: toBase64(toUtf8(JSON.stringify(ibcTransferMsg)))
    }
  }
}

// TODO: functions for finding the 
// export function parseClassId() {}
// export function annotateClassIdToProvenance() {}