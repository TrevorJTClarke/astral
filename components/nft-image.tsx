import React from 'react';
import { getHttpUrl } from '../config/defaults'

export interface NftImage {
  uri: string
  alt?: string
  className?: string
  backgroundUrl?: string
}

// TODO:  poster={`https://i.stargaze-apis.com/HSmt85eLaQ1AlJlbkU05tP96Yq7eU4EdygpoGQcBFRM/f:jpg/resize:fit:700:::/dpr:2/plain/${imageSource}`}
export default function NftImage({ uri, alt, className, backgroundUrl }: NftImage) {
  if (!uri) return;
  const imageSource = `${uri}`.search('ipfs:') > -1 ? getHttpUrl(uri) : uri
  const isVideo = `${uri}`.search('mp4') > -1
  const styles = { background: backgroundUrl }
  return (
    <div>
      <div className={className + " h-full w-full overflow-hidden rounded"}>
        <div className=" h-full w-full transform-gpu transition-transform group-hover/card:scale-[1.04] group-active/card:scale-100 group-hover/largecard:scale-[1.03] group-active/largecard:scale-100 ">
          <div className="md:aspect-h-1 md:aspect-w-1">
            {backgroundUrl && (
              <div style={styles} className="md:aspect-h-1 md:aspect-w-1"></div>
            )}
            {
              imageSource && !isVideo && (
                <div className="md:aspect-h-1 md:aspect-w-1">
                  <img src={imageSource} height="100%" width="100%" alt={alt || ''} loading="lazy" className="object-cover transition-all" />
                </div>
              )
            }
            {
              imageSource && isVideo && (
                <div className="md:aspect-h-1 md:aspect-w-1">
                  <video height="1024" width="1024" autoPlay playsInline loop muted controls preload="metadata" crossOrigin="anonymous">
                    <source type="video/mp4" src={imageSource} />Your browser does not support this video player.
                  </video>
                </div>
              )
            }
          </div>
        </div>
      </div>
    </div>
  );
}
