import React from "react";
import { OpIdProvider } from "@/hooks/use-opid";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { optimismSepolia } from "viem/chains";
import { http, WagmiProvider } from "wagmi";

const queryClient = new QueryClient();

const wagmiConfig = getDefaultConfig({
  appName: "OpId Airdrop",
  projectId: import.meta.env.VITE_WALLET_CONNECT_ID,
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
          <OpIdProvider>{children}</OpIdProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
