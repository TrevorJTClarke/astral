import { gql } from '@apollo/client';

export const COLLECTIONS = gql`
  query Collections($limit: Int, $sortBy: CollectionSortBy) {
    collections(limit: $limit, sortBy: $sortBy) {
      collections {
        collectionAddr
        floorPrice
      }
    }
  }
`;

export const COLLECTION = gql`
  query Collection($collectionAddr: String!) {
    collection(collectionAddr: $collectionAddr) {
      image
    }
  }
`;

// query OwnedTokens($owner: String!, $limit: Int, $offset: Int, $filterByCollectionAddrs: [String!], $filterForSale: SaleType, $sortBy: TokenSort, $size: ImageSize) {
// filterForSale: $filterForSale
// filterByCollectionAddrs: $filterByCollectionAddrs
// sortBy: $sortBy
export const OWNEDTOKENS_STARGAZE = gql`
query OwnedTokens($owner: String!, $limit: Int, $offset: Int) {
  tokens(ownerAddr: $owner, limit: $limit, offset: $offset) {
    tokens {
      imageUrl
      ownerAddr
      animation {
        contentLength
        contentType
        height
        url
        width
      }
      animationUrl
      collectionAddr
      createdAt
      description
      forSale
      id
      image {
        contentLength
        contentType
        height
        url
        width
      }
      name
      tokenId
      traits {
        name
        rarity
        value
        rarityScore
        rarityPercent
      }
    }
    total
  }
}
`;

// query OwnedTokens($owner: String!, $limit: Int, $offset: Int, $filterByCollectionAddrs: [String!], $filterForSale: SaleType, $sortBy: TokenSort, $size: ImageSize) {
// filterForSale: $filterForSale
// filterByCollectionAddrs: $filterByCollectionAddrs
// sortBy: $sortBy
export const TOKEN_STARGAZE = gql`
query Token($collectionAddr: String!, $tokenId: String!) {
  token(collectionAddr: $collectionAddr, tokenId: $tokenId) {
    id
    name
    description
    tokenId
    rarityScore
    collectionAddr
    ownerAddr
    animation {
      contentLength
      contentType
      height
      url
      width
    }
    animationUrl
    imageUrl
    image {
      contentLength
      contentType
      height
      url
      width
    }
    traits { 
      name
      value
      rarityPercent
      rarity
    }
    owner {
      name {
        name
      }
    }
  }
}
`;

export const defaultEthNetwork = 'ETHEREUM'
export const defaultEthChainId = 'MAINNET'
export const OWNEDTOKENS_ETHEREUM = gql`
query OwnedTokens($owner: [String!], $limit: Int!) {
  tokens(
    networks: [{network: ${defaultEthNetwork}, chain: ${defaultEthChainId}}],
    pagination: {limit: $limit},
    where: {ownerAddresses: $owner}
  ) {
    nodes {
      token {
        collectionAddress
        collectionName
        description
        tokenId
        tokenStandard
        tokenUrlMimeType
        name
        owner
        content {
          url
          mimeType
        }
        image {
          url
          mimeType
        }
        networkInfo {
          network
          chain
        }
        metadata
      }
    }
  }
}
`;
export const GET_TOKEN_ETHEREUM = gql`
query OwnedTokens($address: String!, $tokenId: String!) {
  token(
    network: {network: ${defaultEthNetwork}, chain: ${defaultEthChainId}},
    token: {address: $address, tokenId: $tokenId}
  ) {
    token {
      collectionAddress
      collectionName
      description
      tokenId
      tokenStandard
      tokenUrlMimeType
      name
      owner
      content {
        url
        mimeType
      }
      image {
        url
        mimeType
      }
      networkInfo {
        network
        chain
      }
      mintInfo {
        originatorAddress
        toAddress
      }
      tokenContract {
        collectionAddress
        name
        description
        symbol
        totalSupply
      }
      metadata
    }
  }
}
`;