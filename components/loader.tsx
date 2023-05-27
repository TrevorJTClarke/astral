export default function Loader() {
  return (
    <div className="relative overflow-hidden min-h-[300px]">
      <div className="loader-body">
        <span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </span>
        <div className="loader-base">
          <span></span>
          <div className="loader-face"></div>
        </div>
      </div>
      <div className="loader-longfazers">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
}
