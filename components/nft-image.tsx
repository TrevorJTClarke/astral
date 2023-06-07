import React from 'react';
import { getHttpUrl } from '../config/defaults'

export interface NftImage {
  uri: string
  alt?: string
  className?: string
}

export default function NftImage({ uri, alt, className }: NftImage) {
  const imageSource = `${uri}`.search('ipfs:') > -1 ? getHttpUrl(uri) : uri

  return (
    <div>
      <div className={className + " h-full w-full overflow-hidden rounded"}>
        <div className=" h-full w-full transform-gpu transition-transform group-hover/card:scale-[1.04] group-active/card:scale-100 group-hover/largecard:scale-[1.03] group-active/largecard:scale-100 ">
          <div className="md:aspect-h-1 md:aspect-w-1">
            <div className="md:aspect-h-1 md:aspect-w-1">
              <img
                src={imageSource}
                height="100%" width="100%" alt={alt || ''} className="object-contain transition-all" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
