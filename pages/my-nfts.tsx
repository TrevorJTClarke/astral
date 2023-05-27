import { useState } from "react";
import Loader from '../components/loader'
import NftImage from '../components/nft-image'

export default function MyNfts() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  // TODO: Check if authed, to show them to connect before checkign NFT holdings

  setTimeout(() => {
    setIsLoading(false);
    setHasData(true);
  }, 1000)

  const nfts = [
    {
      id: '1234',
      uri: 'https://res.cloudinary.com/stargaze/image/upload/f_jpg,w_700/qwktjeervndbdheovlye',
      title: 'THX',
      classId: 'p6/c6/p4/c4/p2/c2/nftClass',
      classUri: '',
    },
    {
      id: '1235',
      uri: 'https://res.cloudinary.com/stargaze/image/upload/f_auto,w_700/deajoau4sl3w9fg0mzft',
      title: 'THX',
      classId: 'p6/c6/p4/c4/p2/c2/nftClass',
      classUri: '',
    },
    {
      id: '1236',
      uri: 'https://res.cloudinary.com/stargaze/image/upload/f_auto,w_700/pnb2wkbcnlhppush402q',
      title: 'THX',
      classId: 'p6/c6/p4/c4/p2/c2/nftClass',
      classUri: '',
    },
  ]

  return (
    <div className="my-24">
      <div className="text-center">
        <h1 className="mb-6 text-center text-3xl font-semibold xl:text-5xl">
          My NFTs
        </h1>
      </div>

      {isLoading && (<div className="relative mx-auto mb-24 text-center text-white">
        <Loader />
        <h2 className="text-2xl animate-pulse">Loading NFTs...</h2>
      </div>)}

      {(!isLoading && !hasData) && (<div className="my-24 mx-auto text-center text-white">
        <h2 className="text-xl mb-4">No NFTs Found!</h2>
        <p className="text-md text-gray-500 mt-4">Looks like you don't have any NFTs yet, go get some on:</p>
        <a href="https://app.stargaze.zone/marketplace" target="_blank" className="inline-flex mt-8 mb-4 items-center justify-center px-8 py-4 text-base font-medium rounded-lg text-white border-2 border-pink-600 hover:border-pink-600/80">
          <img src="/stargaze.svg" alt="Stargaze Marketplace" className="w-[200px]" width="100%" />
        </a>
      </div>)}

      {(!isLoading && hasData) && (
        <div className="relative px-4 pt-4 sm:mx-8 sm:pt-8 md:px-0">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-8 xl:grid-cols-4">
            {nfts.map((nft, idx) => (
              <div key={idx} className="group relative h-full overflow-hidden bg-white transition-shadow divide-y rounded-lg shadow-sm divide-neutral-300 hover:shadow-md dark:divide-zinc-800 dark:bg-black group/card border border-zinc-800 focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2">
                <a className="z-[2] focus:outline-none" href={'my-nfts/' + nft.id}>
                  <div className="relative bg-neutral-50 dark:bg-black">
                    <NftImage uri={nft.uri} alt={nft.title} />
                  </div>
                  <div className="opacity-30 group-hover:opacity-100 absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-sm font-semibold md:right-4 md:top-4 bg-pink-500 text-white">IBC</div>
                  <div className="inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 lg:absolute lg:pt-24">
                    <p className="text-lg font-semibold text-black drop-shadow-xl dark:text-white sm:text-2xl">{nft.title}</p>
                    <div className="mt-3 flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between md:text-base">
                      <div>
                        <div className="text-sm text-white/75">Mint Price</div>
                        <div className="font-semibold text-white">7.5K STARS</div>
                      </div>
                      <div>
                        <div className="text-sm text-white/75">Available</div>
                        <div className="font-semibold text-white"><span
                          className="relative -left-1 !h-max animate-blink rounded p-1">15</span></div>
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
