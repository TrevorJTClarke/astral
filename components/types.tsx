import { MouseEventHandler, ReactNode } from 'react'

export interface ChooseChainInfo {
  chainName: string
  chainRoute?: string
  label: string
  value: string
  icon?: string
  disabled?: boolean
}

export enum WalletStatus {
  NotInit = 'NotInit',
  Loading = 'Loading',
  Loaded = 'Loaded',
  NotExist = 'NotExist',
  Rejected = 'Rejected',
}

export interface ConnectWalletType {
  buttonText?: string
  isLoading?: boolean
  isDisabled?: boolean
  icon?: ReactNode
  onClickConnectBtn?: MouseEventHandler<HTMLButtonElement>
}

export interface ConnectedUserCardType {
  walletIcon?: string
  username?: string
  icon?: ReactNode
}

export interface FeatureProps {
  title: string
  text: string
  href: string
}

export interface NavProps {
  title: string
  href: string
}

export interface ChainCardProps {
  prettyName: string
  icon?: string
}


export type Rename<T, K extends keyof T, R extends PropertyKey> = Omit<T, K> & {
  [P in R]: T[K];
};

export type Minter = VendingMinterConfigResponse &
  Rename<MintableNumTokensResponse, 'count', 'remaining_tokens'> &
  Rename<Omit<MintCountResponse, 'address'>, 'count', 'user_minted'> & {
    all_prices: MintPriceResponse;
  };

export type SG721 = CollectionInfoResponse & ContractInfoResponse;

export type Whitelist = WhitelistConfigResponse;

export enum TransactionResult {
  Success = 0,
  Failed = 1,
}

export type TData = {
  balanceAmount: string;
  starsPrice: number;
  collectionInfo: {
    minter?: Minter;
    sg721: SG721;
    whitelist?: Whitelist;
  };
};

export type Token = {
  description: string;
  image: string;
  name: string;
};

export type Collections = {
  collections: {
    collections: {
      collectionAddr: string;
      floorPrice: number;
    }[];
  };
};

export type Collection = {
  collection: {
    image: string;
  };
};

export type CollectionItem = {
  id: string;
  contractAddress: string;
};

export type ContractsAddress = {
  minter?: string;
  sg721: string;
};

export type Image = {
  height: any;
  width: any;
  jpgLink: string;
  isAnimated: any;
  format: any;
  mp4Link: any;
  webmLink: any;
}

export type Media = {
  image: Image;
  type: string;
  url: string;
  originalUrl: string;
  fileExtension: string;
}

export type TokenItem = {
  id: string;
  tokenId: string;
  name: string;
  rarityOrder: number;
  rarityScore: number;
  mintedAt: string;
  price: any;
  expiresAtDateTime: any;
  highestOffer: {
    price: string;
  };
  media: Media;
  collection: CollectionItem;
};

export type Tokens = {
  tokens: {
    tokens: TokenItem[];
  };
  pageInfo: {
    total: number;
    limit: number;
    offset: number;
  };
};

export type OwnedTokens = {
  tokens: Tokens;
};