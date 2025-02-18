import { ConnectButton } from "@rainbow-me/rainbowkit";

export const ConnectWalletButton = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const connected = mounted && account && chain;
        return (
          <div
            {...(!mounted && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    className="btn btn-neutral w-full"
                    onClick={openConnectModal}
                    type="button"
                  >
                    Connect Wallet To Request Airdrop
                  </button>
                );
              }
              if (chain.unsupported) {
                return (
                  <button
                    className="btn btn-error w-full"
                    onClick={openChainModal}
                    type="button"
                  >
                    Wrong network
                  </button>
                );
              }
              return (
                <button
                  className="btn btn-neutral w-full"
                  onClick={openAccountModal}
                  type="button"
                >
                  {account.displayName}
                  {account.displayBalance ? ` (${account.displayBalance})` : ""}
                </button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
