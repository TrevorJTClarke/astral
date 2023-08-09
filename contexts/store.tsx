import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set, get) => ({
      nfts: [],
      addWallet: (wallet) => set((state) => ({ wallets: state.wallets.push(wallet) })),
    }),
    {
      name: 'astral_wahwett',
      // storage: createJSONStorage(() => sessionStorage),
    }
  )
)