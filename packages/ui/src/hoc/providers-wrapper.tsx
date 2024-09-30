import React from "react";
import { OpIdAirdropProvider } from "@/hooks/use-opid-airdrop";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { optimismSepolia } from "viem/chains";
import { http, WagmiProvider } from "wagmi";

const queryClient = new QueryClient();

const wagmiConfig = getDefaultConfig({
  appName: "OpId Airdrop",
  projectId: "8b2b4e449505c0e3dc82dab8b3973d09",
  chains: [optimismSepolia],
  ssr: false,
  transports: {
    [optimismSepolia.id]: http(import.meta.env.VITE_RPC_URL),
  },
});

interface ProvidersWrapperProps {
  children: React.ReactNode;
}

export default function ProvidersWrapper({ children }: ProvidersWrapperProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <OpIdAirdropProvider>{children}</OpIdAirdropProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
