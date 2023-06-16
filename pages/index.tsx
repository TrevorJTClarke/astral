import Link from 'next/link'
import Image from 'next/image'
import { classNames } from '../config'
import Highlights from '../components/highlights'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

const features = [
  {
    name: 'Seamless Interchain Transfers',
    description: 'No more being locked into one blockchain. With Astral, you can easily transfer NFTs across various blockchains including Stargaze, Osmosis, Juno, Uptick & Iris.',
    imageSrc: '/docs/transfer_nft_ics721.gif',
    imageAlt: '',
    ctaName: 'View NFTs',
    ctaHref: '/my-nfts',
  },
  {
    name: 'Transparent Provenance',
    description: 'Trust in the authenticity of your NFTs. Astral prioritizes showing you the complete provable history of any NFT, increasing transparency and value in each marketplace.',
    imageSrc: '/docs/provenance.png',
    imageAlt: '',
    ctaName: '',
    ctaHref: null,
  },
  {
    name: 'NFT Tools Powered by IBC',
    description: 'Astral offers user-friendly NFT tools, for easy management of ICS721 compatible NFTs, all powered by Cosmos-SDK Inter-Blockchain Communication (IBC).',
    imageSrc: '/docs/nft_tools.png',
    imageAlt: '',
    ctaName: 'View Tools',
    ctaHref: '/tools',
  },
]

export default function Index() {

  return (
    <div className="relative ">
      <div className="absolute z-0 overflow-hidden h-full w-full">
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
      </div>
      <div className="pt-[20vh] pb-10 flex flex-col text-center">

        <div className="mb-6 mx-auto">
          <Image src="/ASTRAL_LOGO.svg" alt="ASTRAL" width="600px" height="100%" />
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl md:text-3xl">
          Unleash the&nbsp;
          <span className="text-pink-600">
            Interchain NFT
          </span>
          &nbsp;Revolution
        </h1>
        <p className="mt-2 text-lg text-gray-500 sm:text-center">
          Your NFT collection can finally move between & through any blockchain
        </p>
      </div>

      <Highlights />

      <div className="relative z-20">
        <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6 sm:py-32 lg:max-w-7xl lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-pink-600 sm:text-4xl">Interchain Projection</h2>
            <p className="mt-4 text-gray-500">
              Astral serves as your bridge in the vast expanse of the blockchain universe. Use Astral for smooth transfers, transparent provenance and powerful NFT tools in the next chapter of the NFT revolution.
            </p>
          </div>

          <div className="mt-16 space-y-16">
            {features.map((feature, featureIdx) => (
              <div
                key={feature.name}
                className="flex flex-col-reverse lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-8"
              >
                <div
                  className={classNames(
                    featureIdx % 2 === 0 ? 'lg:col-start-1' : 'lg:col-start-8 xl:col-start-9',
                    'mt-6 lg:col-span-5 lg:row-start-1 lg:mt-0 xl:col-span-4'
                  )}
                >
                  <h3 className="text-2xl font-medium text-pink-600">{feature.name}</h3>
                  <p className="mt-2 text-md text-gray-500">{feature.description}</p>
                  {feature.ctaHref && (
                    <Link href={feature.ctaHref}>
                      <div className="mt-6 cursor-pointer flex-none rounded-lg border border-transparent font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 disabled:cursor-not-allowed disabled:opacity-40 bg-pink-600 text-white shadow-sm hover:bg-pink-700 inline-flex items-center justify-center h-10 px-4 py-2 text-sm">
                        <span>{feature.ctaName}</span>
                        <ArrowRightIcon className="flex-shrink-0 w-5 h-5 ml-2 text-white" />
                      </div>
                    </Link>
                  )}
                </div>
                <div
                  className={classNames(
                    featureIdx % 2 === 0 ? 'lg:col-start-6 xl:col-start-5' : 'lg:col-start-1',
                    'flex-auto lg:col-span-7 lg:row-start-1 xl:col-span-8'
                  )}
                >
                  <div className="aspect-h-2 aspect-w-5 overflow-hidden rounded-lg bg-gray-900 border border-1 border-gray-800">
                    <img src={feature.imageSrc} alt={feature.imageAlt} width="100%" height="100%" className="object-cover object-center w-full h-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
    </div>
  );
}
