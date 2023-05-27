import { useEffect, useState } from 'react';

export default function Index() {
  const chainName = process.env.NEXT_PUBLIC_CHAIN ?? 'stargaze';

  return (
    <div>

      <div className="max-w-5xl py-10 mx-6 lg:mx-auto">

        <div className="flex flex-col text-center">
          {/* <h1 className="mb-6 text-center text-3xl font-semibold mt-16 xl:text-5xl">
            Astral
          </h1> */}
          <div className="mb-6 mx-auto">
            <img src="/ASTRAL_LOGO.svg" alt="ASTRAL" className="w-[300px]" width="100%" />
          </div>
          <h1 className="text-2xl font-bold sm:text-3xl md:text-3xl">
            Interchain&nbsp;
            <span className="text-pink-600">
              NFTs
            </span>
          </h1>
        </div>
        <div className="grid gap-8 mb-14 md:grid-cols-2 lg:grid-cols-3">
          Actions
        </div>
        <div className="grid gap-8 mb-20 md:grid-cols-2">
          NFTs
        </div>

      </div>
      
    </div>
  );
}
