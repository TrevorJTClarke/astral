import { useState } from "react";
import Loader from '../../components/loader'
import NftImage from '../../components/nft-image'

export default function NftDetail() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

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

  // const nft = nfts.find((id) => id === )
  const nft = nfts[0]

  return (
    <div className="my-4">


      {isLoading && (<div className="relative mx-auto mb-24 text-center text-white">
        <Loader />
        <h2 className="text-2xl animate-pulse">Loading...</h2>
      </div>)}

      {(!isLoading && !hasData) && (<div className="my-24 mx-auto text-center text-white">
        <h2 className="text-xl mb-4">No NFT Found!</h2>
      </div>)}

      {/* {(!isLoading && hasData) && (
        <div className="relative px-4 pt-4 sm:mx-8 sm:pt-8 md:px-0">
          <div className="grid grid-cols-2 gap-4">
            <NftImage uri={nft.uri} alt={nft.title} />
            <div className="text-center">
              <h1 className="mb-6 text-center text-3xl font-semibold xl:text-5xl">
                {nft.title}
              </h1>
            </div>
          </div>
        </div>
      )} */}

      {(!isLoading && hasData) && (
        <div>

          <div className="mx-auto bg-white p-4 pb-12 dark:bg-black sm:p-6 lg:p-8">
            <div className="mx-auto gap-x-8 p-0 sm:px-6 lg:grid lg:max-w-screen-2xl lg:grid-cols-2 lg:gap-x-24">
              <div className="flex flex-col shrink divide-y border bg-white transition-shadow rounded-lg border-zinc-300 shadow-sm dark:border-zinc-800 divide-zinc-300 hover:shadow-md dark:divide-zinc-800 dark:bg-black w-full overflow-hidden rounded-l-lg sm:rounded-t-lg sm:rounded-bl-none" >
                <div className="relative overflow-hidden  bg-zinc-50 dark:bg-black">
                  <a href="/marketplace/stars19jq6mj84cnt9p7sagjxqf8hxtczwc8wlpuwe4sh62w45aheseues57n420/1434">
                    <div className="h-full w-full overflow-hidden rounded">
                      <div className=" h-full w-full transform-gpu transition-transform group-hover/card:scale-[1.04] group-active/card:scale-100 group-hover/largecard:scale-[1.03] group-active/largecard:scale-100 ">
                        <img src="https://res.cloudinary.com/stargaze/image/upload/w_700/fovfwckej1ahgvluo0q8.jpg" alt="" height="700" width="700" className="h-full w-full transform-gpu object-contain opacity-100 transition-transform group-hover/card:scale-[1.04] group-hover/largecard:scale-[1.03] group-active/card:scale-100 group-active/largecard:scale-100" />
                      </div>
                    </div>
                  </a>
                </div>
              </div>
              <div className="mt-8 lg:mt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <a className="mb-2 text-xs font-semibold uppercase text-pink-500 hover:text-pink" href="/marketplace/stars19jq6mj84cnt9p7sagjxqf8hxtczwc8wlpuwe4sh62w45aheseues57n420">Bad Kids</a>
                    <div className="mb-2 text-2xl font-semibold">Bad Kid #1434</div>
                  </div>
                  <button className="flex-none rounded-lg text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 disabled:cursor-not-allowed disabled:opacity-40 text-red-500 bg-transparent border-red-500 hover:bg-red-600 hover:border-red-600 hover:text-white shadow-sm inline-flex items-center justify-center border-0 px-2 py-1.5" type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z"> </path>
                    </svg>
                  </button>
                </div>
                <div className="text-sm text-zinc-300">Bad Kids is a collection of 9,999 bad drawings of bad kids</div>
                <p className="mt-2 text-sm text-zinc-300">
                  <span>Created by</span>
                  <span className="group inline-flex max-w-full items-center gap-2 cursor-pointer text-pink-500 hover:text-pink-600">
                    <span className="max-w-full">
                      <a className="rounded-sm focus-visible:outline focus-visible:outline-pink-500 focus-visible:outline-2 focus-visible:outline-offset-2" href="/profile/stars15y38ehvexp6275ptmm4jj3qdds379nk07tw95r">
                        <span className="inline-flex relative overflow-hidden max-w-full">
                          <span aria-hidden="false" className="max-w-full break-all transition truncate">badkids.stars</span>
                          <span className="absolute inset-0 inline-flex items-center transition translate-y-8 opacity-0">
                            <span className="truncate" aria-hidden="true">stars15y...w95r</span>
                          </span>
                        </span>
                      </a>
                    </span>
                    <button aria-label="Copy" className="w-4 h-4 text-white group/button relative inline focus:outline-none">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" className="w-4 h-4 text-white inline absolute inset-0 scale-0 opacity-0 transition">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"> </path>
                      </svg>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="w-4 h-4 text-white inline absolute inset-0 scale-0 opacity-0 transition group-hover:scale-100 group-hover:opacity-80 group-focus-visible/button:scale-110 group-focus-visible/button:opacity-100 group-hover/button:scale-110 group-active/button:scale-100">
                        <path d="M2 4.25A2.25 2.25 0 014.25 2h6.5A2.25 2.25 0 0113 4.25V5.5H9.25A3.75 3.75 0 005.5 9.25V13H4.25A2.25 2.25 0 012 10.75v-6.5z"> </path>
                        <path d="M9.25 7A2.25 2.25 0 007 9.25v6.5A2.25 2.25 0 009.25 18h6.5A2.25 2.25 0 0018 15.75v-6.5A2.25 2.25 0 0015.75 7h-6.5z"> </path>
                      </svg>
                    </button>
                  </span>
                </p>
                <div className="inline-flex items-end gap-1 text-sm font-semibold text-zinc-300 mt-2">
                  <div data-tooltip-id=":r8o:" data-tooltip-content="Rarity: #4774 / 9999 " data-tooltip-place="top" className="flex">
                    <div className="inline-flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" className="h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"> </path>
                      </svg>
                      4774
                    </div>
                  </div>
                </div>
                <div className="my-8">
                  <div className="grid grid-cols-2 gap-2 sm:max-w-xs">
                    <button className="flex-none rounded-lg border border-transparent font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 disabled:cursor-not-allowed disabled:opacity-40 bg-pink-600 text-white shadow-sm hover:bg-pink-700 inline-flex items-center justify-center h-10 px-4 py-2 text-sm" type="submit">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" className="-ml-1 mr-2 h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"></path></svg>
                      <span>Transfer</span>
                    </button>
                    <button className="flex-none rounded-lg border font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 disabled:cursor-not-allowed disabled:opacity-40 bg-transparent text-pink-500 shadow-sm hover:bg-pink hover:border-pink hover:text-white border-pink-500 inline-flex items-center justify-center h-10 px-4 py-2 text-sm" type="submit">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" className="w-5 h-5 mr-2 -ml-1"> <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"> </path> </svg>
                      <span className="flex-none">Sell</span>
                    </button>
                  </div>
                </div>
                <div className="my-8 flex flex-wrap justify-start gap-y-3 rounded-lg border border-zinc-800 p-3 md:mt-0 md:justify-between md:gap-y-3 md:p-4">
                  <div className="flex w-1/3 flex-col gap-1 md:w-auto md:gap-2">
                    <div className="text-sm text-zinc-400">Owner</div>
                    <div className="text-sm text-white">
                      <span className="group inline-flex max-w-full items-center gap-2 text-pink-500 hover:text-pink-600">
                        <span className="max-w-full">
                          <a className="rounded-sm focus-visible:outline focus-visible:outline-pink-500 focus-visible:outline-2 focus-visible:outline-offset-2" href="/profile/stars13fmynf7lartwxfx4c3cv3afe07qlckzyudv8rz">
                            <span className="inline-flex relative overflow-hidden max-w-full">
                              <span aria-hidden="false" className="max-w-full break-all transition">333mm.stars</span>
                              <span className="absolute inset-0 inline-flex items-center transition translate-y-8 opacity-0">
                                <span className="truncate" aria-hidden="true">stars13f...v8rz</span>
                              </span>
                            </span>
                          </a>
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="flex w-1/3 flex-col gap-1 md:w-auto md:gap-2">
                    <div className="text-sm text-zinc-400">Last Sale</div>
                    <div className="text-sm text-white">28K STARS</div>
                  </div>
                  <div className="flex w-1/3 flex-col gap-1 md:w-auto md:gap-2">
                    <div className="text-sm text-zinc-400">Top Offer</div>
                    <div className="text-sm text-white">22.1K STARS</div>
                  </div>
                </div>
                <div className="col-span-2 mt-8 rounded-lg border border-zinc-800">
                  <div className="border-b border-zinc-800 p-4 sm:flex sm:items-center">
                    <div className="inline-flex flex-col justify-center sm:flex-auto sm:flex-row">
                      <h1 className="inline-flex flex-auto items-center gap-2 font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" className="w-5"> <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"> </path> </svg>
                        <span>Provenance</span>
                      </h1>
                    </div>
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
                      <div className="inline-block min-w-full align-middle md:px-6 lg:px-8">
                        <table className="min-w-full">
                          <thead>
                            <tr className="overflow-scroll">
                              <th scope="col" className="sticky top-0 z-10 border-b border-zinc-800 px-3 py-3.5 text-left font-medium backdrop-blur justify-center text-sm"> Type</th>
                              <th scope="col" className="sticky top-0 z-10 border-b border-zinc-800 px-3 py-3.5 font-medium backdrop-blur text-center text-sm sm:pl-4"> Price</th>
                              <th scope="col" className="sticky top-0 z-10 border-b border-zinc-800 px-3 py-3.5 font-medium backdrop-blur min-w-min text-center text-sm"> Floor Price (% Δ)</th>
                              <th scope="col" className="sticky top-0 z-10 border-b border-zinc-800 px-3 py-3.5 font-medium backdrop-blur text-center text-sm"> Expires</th>
                              <th scope="col" className="sticky top-0 z-10 border-b border-zinc-800 px-3 py-3.5 font-medium backdrop-blur text-center text-sm"> From</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className=" hover:bg-zinc-900">
                              <td
                                className="border-b border-zinc-800 whitespace-nowrap py-4 pl-4 pr-3 text-center text-sm font-medium text-zinc-300 hover:text-white">
                                <div data-tooltip-id=":r8p:" data-tooltip-content="Collection Offer" data-tooltip-place="top">
                                  <div className="grid place-items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" className="h-5 w-5"> <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"> </path> </svg>
                                  </div>
                                </div>
                              </td>
                              <td className="border-b border-zinc-800 whitespace-nowrap px-3 py-4 text-center text-sm text-zinc-300 hover:text-white"> 22.1K STARS</td>
                              <td className="border-b border-zinc-800 whitespace-nowrap px-3 py-4 text-center text-sm text-zinc-300 hover:text-white"> -31% below</td>
                              <td className="border-b border-zinc-800 whitespace-nowrap px-3 py-4 text-center text-sm text-zinc-300 hover:text-white"> in 14 days</td>
                              <td className="border-b border-zinc-800 whitespace-nowrap px-3 py-4 text-center text-sm text-zinc-300">
                                <span className="group inline-flex max-w-full items-center gap-2 cursor-pointer text-pink-500 hover:text-pink-600">
                                  <span className="max-w-full">
                                    <a className="rounded-sm focus-visible:outline focus-visible:outline-pink-500 focus-visible:outline-2 focus-visible:outline-offset-2" href="/profile/stars13fmynf7lartwxfx4c3cv3afe07qlckzyudv8rz">
                                      <span className="inline-flex relative overflow-hidden max-w-full">
                                        <span aria-hidden="false" className="max-w-full break-all transition truncate">333mm.stars</span>
                                        <span className="absolute inset-0 inline-flex items-center transition translate-y-8 opacity-0">
                                          <span className="truncate" aria-hidden="true">stars13f...v8rz</span>
                                        </span>
                                      </span>
                                    </a>
                                  </span>
                                  <button aria-label="Copy" className="w-4 h-4 text-white group/button relative inline focus:outline-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" className="w-4 h-4 text-white inline absolute inset-0 scale-0 opacity-0 transition"> <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"> </path> </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="w-4 h-4 text-white inline absolute inset-0 scale-0 opacity-0 transition group-hover:scale-100 group-hover:opacity-80 group-focus-visible/button:scale-110 group-focus-visible/button:opacity-100 group-hover/button:scale-110 group-active/button:scale-100"> <path d="M2 4.25A2.25 2.25 0 014.25 2h6.5A2.25 2.25 0 0113 4.25V5.5H9.25A3.75 3.75 0 005.5 9.25V13H4.25A2.25 2.25 0 012 10.75v-6.5z"> </path> <path d="M9.25 7A2.25 2.25 0 007 9.25v6.5A2.25 2.25 0 009.25 18h6.5A2.25 2.25 0 0018 15.75v-6.5A2.25 2.25 0 0015.75 7h-6.5z"> </path> </svg>
                                  </button>
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>
      )}

    </div>
  );
}
