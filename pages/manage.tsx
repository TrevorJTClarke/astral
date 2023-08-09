import { ConnectButtonEthereum } from '../components/connect-button-ethereum'
import { ConnectButtonCosmos } from '../components/connect-button-cosmos'

export default function Manager() {
  return (
    <div className="min-h-window py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-12 text-center text-3xl font-semibold xl:text-5xl">
          Manage Your Wallets
        </h1>

        <div className="mx-auto max-w-2xl">
          <div className="flex justify-between border border-transparent border-b-zinc-800 mb-4 pb-2">
            <h3 className="font-bold text-white/90 mt-auto">Active Wallets</h3>
          </div>

          <div className="flex flex-col gap-4">
            <ConnectButtonCosmos />
            <ConnectButtonEthereum />
          </div>
        </div>
      </div>
    </div>
  );
}
