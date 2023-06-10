import type { NftImage as NftImageType } from "./nft-image";
import NftImage from "./nft-image";

export default function NftLoader({ uri, alt }: NftImageType) {
  return (
    <div className="flex relative overflow-hidden min-h-[300px]">
      <div className="loader-image">
        <span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </div>
      <div className="loader-longfazers">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div className="w-24 m-auto">
        <NftImage className="loader-image-speeder" uri={uri} alt={alt} />
      </div>
    </div>
  );
}
