import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import NftImage from './nft-image'

const reviews = [
  {
    url: '/nfts/1.png',
    chain_name: 'stargaze',
  },
  {
    url: '/nfts/2.jpg',
    chain_name: 'stargaze',
  },
  {
    url: '/nfts/3.jpg',
    chain_name: 'stargaze',
  },
  {
    url: '/nfts/4.jpeg',
    chain_name: 'stargaze',
  },
  {
    url: '/nfts/5.jpeg',
    chain_name: 'stargaze',
  },
  {
    url: '/nfts/6.webp',
    chain_name: 'stargaze',
  },
  {
    url: '/nfts/7.jpg',
    chain_name: 'stargaze',
  },
  {
    url: '/nfts/8.png',
    chain_name: 'stargaze',
  },
  {
    url: '/nfts/9.webp',
    chain_name: 'stargaze',
  },
  {
    url: '/nfts/10.jpeg',
    chain_name: 'stargaze',
  },
  {
    url: '/nfts/11.jpg',
    chain_name: 'stargaze',
  },
  {
    url: '/nfts/12.png',
    chain_name: 'stargaze',
  },
  {
    url: '/nfts/13.jpeg',
    chain_name: 'stargaze',
  },
  {
    url: '/nfts/14.jpg',
    chain_name: 'stargaze',
  },
  {
    url: '/nfts/15.jpg',
    chain_name: 'stargaze',
  },
  {
    url: '/nfts/16.png',
    chain_name: 'stargaze',
  },
  {
    url: '/nfts/17.webp',
    chain_name: 'stargaze',
  },
  {
    url: '/nfts/18.jpg',
    chain_name: 'stargaze',
  },
  {
    url: '/nfts/19.png',
    chain_name: 'stargaze',
  },
  {
    url: '/nfts/20.jpg',
    chain_name: 'stargaze',
  },
  {
    url: '/nfts/21.jpg',
    chain_name: 'stargaze',
  },
  {
    url: '/nfts/22.jpg',
    chain_name: 'stargaze',
  },
  {
    url: '/nfts/23.png',
    chain_name: 'stargaze',
  },
]

function Highlight({ url, chain_name, className, ...props }) {
  let animationDelay = useMemo(() => {
    let possibleAnimationDelays = ['0s', '0.1s', '0.2s', '0.3s', '0.4s', '0.5s']
    return possibleAnimationDelays[
      Math.floor(Math.random() * possibleAnimationDelays.length)
    ]
  }, [])

  return (
    <figure
      className={clsx(
        'animate-fade-in opacity-0',
        className
      )}
      style={{ animationDelay }}
      {...props}
    >
      <NftImage uri={url} alt="" className="object-cover" />
    </figure>
  )
}

function splitArray(array, numParts) {
  let result = []
  for (let i = 0; i < array.length; i++) {
    let index = i % numParts
    if (!result[index]) {
      result[index] = []
    }
    result[index].push(array[i])
  }
  return result
}

function HighlightColumn({
  className,
  reviews,
  reviewClassName = () => {},
  msPerPixel = 0,
}) {
  let columnRef = useRef()
  let [columnHeight, setColumnHeight] = useState(0)
  let duration = `${columnHeight * msPerPixel}ms`

  useEffect(() => {
    let resizeObserver = new window.ResizeObserver(() => {
      setColumnHeight(columnRef.current.offsetHeight)
    })

    resizeObserver.observe(columnRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div
      ref={columnRef}
      className={clsx('animate-marquee space-y-8 py-4', className)}
      style={{ '--marquee-duration': duration }}
    >
      {reviews.concat(reviews).map((review, reviewIndex) => (
        <Highlight
          key={reviewIndex}
          aria-hidden={reviewIndex >= reviews.length}
          className={reviewClassName(reviewIndex % reviews.length)}
          {...review}
        />
      ))}
    </div>
  )
}

function HighlightGrid() {
  let containerRef = useRef()
  let columns = splitArray(reviews, 5)
  columns = [columns[0], columns[1], splitArray(columns[2], 2), columns[3], columns[4]]

  return (
    <div
      ref={containerRef}
      className="relative -mx-4 mt-[10vh] grid h-[49rem] max-h-[150vh] grid-cols-1 items-start gap-8 overflow-hidden px-4 md:grid-cols-2 lg:grid-cols-5"
    >
      <>
        <HighlightColumn
          reviews={[...columns[0], ...columns[2].flat(), ...columns[1]]}
          reviewClassName={(reviewIndex) =>
            clsx(
              reviewIndex >= columns[0].length + columns[2][0].length &&
              'md:hidden',
              reviewIndex >= columns[0].length && 'lg:hidden'
            )
          }
          msPerPixel={100}
        />
        <HighlightColumn
          reviews={[...columns[1], ...columns[2][1]]}
          className="hidden md:block"
          reviewClassName={(reviewIndex) =>
            reviewIndex >= columns[1].length && 'lg:hidden'
          }
          msPerPixel={150}
        />
        <HighlightColumn
          reviews={columns[2].flat()}
          className="hidden lg:block"
          msPerPixel={50}
        />
        <HighlightColumn
          reviews={columns[3].flat()}
          className="hidden lg:block"
          msPerPixel={120}
        />
        <HighlightColumn
          reviews={columns[4].flat()}
          className="hidden lg:block"
          msPerPixel={95}
        />
      </>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black" />
    </div>
  )
}

export default function Highlights() {
  return (
    <section
      id="reviews"
      aria-labelledby="reviews-title"
      className="pt-2 pb-16 px-8"
    >
      <div className="w-full">
        <HighlightGrid />
      </div>
    </section>
  )
}
