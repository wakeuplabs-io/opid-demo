import { AIRDROP_REQUEST_ID } from "@/constants/airdrop";
import { useOpIdAirdrop } from "@/hooks/use-opid-airdrop";
import {useOpId} from "@/hooks/use-opid";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAccount } from "wagmi";
import { shortenString } from "@/utils/strings";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { address } = useAccount();
  const { airdrop } = useOpIdAirdrop();
  const { wallets, credentials } = useOpId();

  const { data: zkpRequest, isLoading: zkpRequestLoading } = useQuery({
    enabled: !!airdrop && !!address,
    queryKey: ["zkp-request", address],
    queryFn: async () => {
      return await airdrop?.getZKPRequest(AIRDROP_REQUEST_ID, address!);
    },
  });

  const requestAirdropEnabled = useMemo(() => {
    return !(zkpRequest?.isVerified || zkpRequestLoading);
  }, [zkpRequest, zkpRequestLoading]);

  const requestCredentialEnabled = useMemo(() => {
    return credentials.find((c) => c.type.includes("KYCAgeCredential")) === undefined;
  }, [credentials]);

  return (
    <div className="max-w-xl mx-auto w-full text-center space-y-10 py-10 px-4">
      <div>
        <h2 className="font-bold text-xl">OPID ERC20 Airdrop demo</h2>
        <p>
          This demo leverages the OPID identity system to generate and
          distribute OPID Airdrops to users that have a valid KYC credential.
        </p>
        <div className="flex justify-center mt-4">
          <ConnectButton />
        </div>
      </div>

      {address && <>
        <div className="space-y-2">
          <h2>Your DID</h2>
          <div className="border rounded-md bg-gray-50 p-3">
            <code className="block">{shortenString(wallets?.did ?? "")}</code>
            {/* TODO: add copy button */}
          </div>
        </div>

        <div className="space-y-2">
          <h2>Your credentials</h2>
          {requestCredentialEnabled && (
            <button className="btn btn-neutral w-full">
            Request KYCAgeCredential credential
            </button>
          )}
          {credentials.map((credential) => (
            <div className="border rounded-md bg-gray-50 p-3" key={credential.id}>
              <code className="block">{shortenString(credential.id)}</code>
              <code className="block">{shortenString(credential.issuer)}</code>
              <code className="block">{credential.type}</code>
              <code className="block">{credential.issuanceDate}</code>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h2>ERC20 Airdrop</h2>
          {requestAirdropEnabled && (
            <button className="btn btn-neutral w-full">Request airdrop</button>
          )}
          <div className="border rounded-md bg-gray-50 p-3 overflow-x-scroll">
            {zkpRequestLoading ? (
              <p>Loading...</p>
            ) : (
              <>
                <code className="block">
                Verified: {String(zkpRequest?.isVerified ?? false)}
                </code>
                <code className="block">
                Metadata: <br /> {JSON.stringify(zkpRequest?.metadata)}
                </code>
              </>
            )}
          </div>
        </div>
      </>}

    </div>
  );
}

