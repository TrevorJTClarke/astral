import {
  AckWithMetadata,
  CosmWasmSigner,
  Link,
  Logger,
  RelayInfo,
  testutils,
  IbcClient,
} from "@confio/relayer";
import { ExecuteResult, InstantiateResult } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";
import { ChannelPair } from "@confio/relayer/build/lib/link";
import { fromBase64, fromUtf8 } from "@cosmjs/encoding";
import { OfflineSigner } from "@cosmjs/proto-signing";
import { assert } from "@cosmjs/utils";
import { Order } from "cosmjs-types/ibc/core/channel/v1/channel";

const {
  osmosis: oldOsmo,
  wasmd,
  setup,
} = testutils;

export const logger: Logger = {
  debug(message: string, meta?: Record<string, unknown>): Logger {
    const logMsg = meta ? message + ": " + JSON.stringify(meta) : message;
    console.debug("[relayer|debug]: " + logMsg);
    return this;
  },

  info(message: string, meta?: Record<string, unknown>): Logger {
    const logMsg = meta ? message + ": " + JSON.stringify(meta) : message;
    console.info("[relayer|info]: " + logMsg);
    return this;
  },

  error(message: string, meta?: Record<string, unknown>): Logger {
    const logMsg = meta ? message + ": " + JSON.stringify(meta) : message;
    console.error("[relayer|error]: " + logMsg);
    return this;
  },

  warn(message: string, meta?: Record<string, unknown>): Logger {
    const logMsg = meta ? message + ": " + JSON.stringify(meta) : message;
    console.warn("[relayer|warn]: " + logMsg);
    return this;
  },

  verbose(message: string, meta?: Record<string, unknown>): Logger {
    const logMsg = meta ? message + ": " + JSON.stringify(meta) : message;
    console.debug("[relayer|verbose]: " + logMsg);
    return this;
  },
};

export async function instantiateContract(
  client: CosmWasmSigner,
  codeId: number,
  msg: Record<string, unknown>,
  label: string
): Promise<InstantiateResult> {
  const result = await client.sign.instantiate(
    client.senderAddress,
    codeId,
    msg,
    label,
    "auto"
  );
  assert(result.contractAddress);
  return result;
}

export async function getIbcPortId(
  client: CosmWasmSigner,
  contractAddress: string
) {
  const { ibcPortId } = await client.sign.getContract(contractAddress);
  console.debug(`IBC port id: ${ibcPortId}`);
  assert(ibcPortId);
  return ibcPortId;
}

export function executeContract(
  client: CosmWasmSigner,
  contractAddress: string,
  msg: Record<string, unknown>
): Promise<ExecuteResult> {
  return client.sign.execute(
    client.senderAddress,
    contractAddress,
    msg,
    "auto", // fee
    undefined, // no memo
    undefined // no funds
  );
}

// const osmosis = { ...oldOsmo, minFee: "0.025uosmo" };

export interface ContractMsg {
  codeId: number;
  instantiateMsg: Record<string, unknown> | undefined;
}

export interface ChainInfo {
  aClient: CosmWasmSigner;
  bClient: CosmWasmSigner;
  aContractInfos: Record<string, ContractInfo>;
  bContractInfos: Record<string, ContractInfo>;
}

export interface ContractInfo {
  codeId: number;
  address: string | undefined;
}

export interface ChannelInfo {
  channel: ChannelPair;
  link: Link;
}

export async function instantiateAll(
  aClient: CosmWasmSigner,
  bClient: CosmWasmSigner,
  aContracts: Record<string, ContractMsg>,
  bContracts: Record<string, ContractMsg>
): Promise<ChainInfo> {
  console.debug("###### Upload contract to A");
  const aContractInfos = await instantiate(
    aClient,
    aContracts
  );

  console.debug("###### Upload contract to B");
  const bContractInfos = await instantiate(
    bClient,
    bContracts
  );
  return {
    aClient,
    bClient,
    aContractInfos,
    bContractInfos,
  };
}

export async function instantiate(
  client: CosmWasmSigner,
  contracts: Record<string, ContractMsg>
): Promise<Record<string, ContractInfo>> {
  const contractInfos: Record<string, ContractInfo> = {};
  for (const name in contracts) {
    const contractMsg = contracts[name];
    const codeId = contractMsg.codeId;
    assert(codeId);
    console.debug(`- code id: ${codeId}`);
    let address;
    if (contractMsg.instantiateMsg) {
      const { contractAddress } = await instantiateContract(
        client,
        codeId,
        contractMsg.instantiateMsg,
        "label " + name
      );
      console.debug(`- contract address: ${contractAddress}`);
      assert(contractAddress);
      address = contractAddress;
    }
    contractInfos[name] = { codeId, address };
  }
  return contractInfos;
}

export async function ibcSigningClient(
  client: OfflineSigner,
  opts: any,
  logger: Logger
) {
  const account = (await client.getAccounts())[0]
  const options = {
    gasPrice: GasPrice.fromString(opts.minFee),
    logger,
    estimatedBlockTime: opts.estimatedBlockTime || 6000,
    estimatedIndexerTime: opts.estimatedIndexerTime || 6000,
  };
  // const options = {
  //   prefix: opts.prefix,
  //   gasPrice: GasPrice.fromString(opts.minFee),
  //   logger,
  // };
  const ibcClient = await IbcClient.connectWithSigner(opts.tendermintUrlHttp, client, account.address, options);
  return ibcClient;
}

export async function createIbcConnectionAndChannel(
  aSignerClient: CosmWasmSigner,
  aOfflineClient: OfflineSigner,
  aContractAddress: string,
  bSignerClient: CosmWasmSigner,
  bOfflineClient: OfflineSigner,
  bContractAddress: string,
  ordering: Order,
  version: string
): Promise<ChannelInfo> {
  const { ibcPortId: aContractIbcPortId } =
    await aSignerClient.sign.getContract(aContractAddress);
  console.log('aContractIbcPortId', aContractIbcPortId)
  assert(aContractIbcPortId);
  const { ibcPortId: bContractIbcPortId } =
    await bSignerClient.sign.getContract(bContractAddress);
  console.log('bContractIbcPortId', bContractIbcPortId)
  assert(bContractIbcPortId);

  const aIbcClient = await ibcSigningClient(aOfflineClient, { prefix: '', minFee: '0' }, logger);
  const bIbcClient = await ibcSigningClient(bOfflineClient, { prefix: '', minFee: '0' }, logger);

  // create a connection and channel
  const link = await Link.createWithNewConnections(aIbcClient, bIbcClient, logger);
  const channel = await link.createChannel(
    "A",
    aContractIbcPortId,
    bContractIbcPortId,
    ordering,
    version
  );

  return { channel, link };
}

// throws error if not all are success
export function assertAckSuccess(acks: AckWithMetadata[]) {
  const parsedAcks = acks.map((ack) =>
    JSON.parse(fromUtf8(ack.acknowledgement))
  );
  console.debug(`Parsing acks: ${JSON.stringify(parsedAcks)}`);
  for (const parsed of parsedAcks) {
    if (parsed.error) {
      throw new Error(`Unexpected error in ack: ${parsed.error}`);
    }
    if (!parsed.result) {
      throw new Error(`Ack result unexpectedly empty: ${parsed}`);
    }
  }
}

// throws error if not all are errors
export function assertAckErrors(acks: AckWithMetadata[]) {
  for (const ack of acks) {
    const parsed = JSON.parse(fromUtf8(ack.acknowledgement));
    if (parsed.result) {
      throw new Error(`Ack result unexpectedly set`);
    }
    if (!parsed.error) {
      throw new Error(`Ack error unexpectedly empty`);
    }
  }
}

export function assertPacketsFromA(
  relay: RelayInfo,
  count: number,
  success: boolean
) {
  if (relay.packetsFromA !== count) {
    throw new Error(`Expected ${count} packets, got ${relay.packetsFromA}`);
  }
  if (relay.acksFromB.length !== count) {
    throw new Error(`Expected ${count} acks, got ${relay.acksFromB.length}`);
  }
  if (success) {
    assertAckSuccess(relay.acksFromB);
  } else {
    assertAckErrors(relay.acksFromB);
  }
}

export function assertPacketsFromB(
  relay: RelayInfo,
  count: number,
  success: boolean
) {
  if (relay.packetsFromB !== count) {
    throw new Error(`Expected ${count} packets, got ${relay.packetsFromB}`);
  }
  if (relay.acksFromA.length !== count) {
    throw new Error(`Expected ${count} acks, got ${relay.acksFromA.length}`);
  }
  if (success) {
    assertAckSuccess(relay.acksFromA);
  } else {
    assertAckErrors(relay.acksFromA);
  }
}

export function parseAcknowledgementSuccess<T>(ack: AckWithMetadata): T {
  const response = JSON.parse(fromUtf8(ack.acknowledgement));
  assert(response.result);
  return JSON.parse(fromUtf8(fromBase64(response.result)));
}
