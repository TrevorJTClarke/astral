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
export const OWNEDTOKENS = gql`
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
