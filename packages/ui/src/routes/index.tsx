import {
  AIRDROP_REQUEST_ID,
  OPID_AIRDROP_ADDRESS,
  OPID_AIRDROP_DECIMALS,
} from "@/constants/airdrop";
import { useOpIdAirdrop } from "@/hooks/use-opid-airdrop";
import { useOpId } from "@/hooks/use-opid";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { shortenString } from "@/utils/strings";
import { core } from "@wakeuplabs/opid-sdk";
import { formatUnits } from "ethers";
import { kycAgeClaimIssuer } from "@/services/kyc-age-issuer";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { airdrop } = useOpIdAirdrop();
  const { wallets, credentials, saveCredentials } = useOpId();

  const { copyToClipboard, copied } = useCopyToClipboard({ timeout: 1000 });

  // load airdrop status
  const { data: zkpRequest, isLoading: zkpRequestLoading } = useQuery({
    enabled: !!airdrop && !!address,
    queryKey: ["zkp-request", address ?? "0x"],
    queryFn: () => {
      if (!airdrop || !address) return;
      return airdrop.getAirdropStatus(AIRDROP_REQUEST_ID, address);
    },
  });

  // claim kyc age credential
  const { mutate: claimCredential, isPending: claimCredentialPending } =
    useMutation({
      mutationFn: async () => {
        if (!wallets || !credentials) return;

        // create credential and publish state
        // It's worth mentioning that for demo porpoises we are blindly trusting user is worthy.
        // in real world case issuer should run their own checks to have a bigger trust from validators
        await kycAgeClaimIssuer.createKycAgeClaim(wallets.did, 19960424);
        await kycAgeClaimIssuer.publishIssuerState();

        // fetch and save credentials locally
        await saveCredentials(
          await kycAgeClaimIssuer.getKycAgeClaims(wallets.did)
        );
      },
      onSuccess: () => alert("Credential claim was successful"),
      onError: () => alert("Credential claim failed"),
    });

  // generate credential proof and claim airdrop with it
  const { mutate: claimAirdrop, isPending: claimAirdropPending } = useMutation({
    mutationFn: async () => {
      if (!airdrop || !address || !wallets) return;

      const proof = await airdrop.generateProof(
        core.DID.parse(wallets.did),
        address!
      );
      return await airdrop.submitPoof(AIRDROP_REQUEST_ID, proof);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["zkp-request", address ?? "0x"],
      });
      alert("Airdrop request was successful");
    },
    onError: () =>  alert("Airdrop request failed")
  });


  // block request airdrop if we already verified the proof. tx would fail anyways, this is just ux
  const requestAirdropEnabled = useMemo(() => {
    return !(zkpRequest?.isVerified || zkpRequestLoading);
  }, [zkpRequest, zkpRequestLoading]);

  // if we already have a valid credential prevent spamming by disabling request
  const requestCredentialEnabled = useMemo(() => {
    return (
      credentials.find((c) => c.type.includes("KYCAgeCredential")) === undefined
    );
  }, [credentials]);

  return (
    <div className="max-w-xl mx-auto w-full text-center space-y-10 py-10 px-4">
      <div>
        <h2 className="font-bold text-xl">OPID ERC20 Airdrop demo</h2>
        <p>
          This demo leverages the OPID identity system to generate and
          distribute tokens to users that have a valid KYC Age credential.
        </p>
        <div className="flex justify-center mt-4">
          <ConnectButton showBalance={true} />
        </div>
      </div>

      {address && (
        <>
          {/* did section */}
          <div className="space-y-2">
            <h2 className="font-bold">Your DID</h2>
            <button
              disabled={copied}
              onClick={() => wallets?.did && copyToClipboard(wallets.did)}
              className="btn btn-neutral w-full"
            >
              {copied ? "Copied" : "Copy DID"}
            </button>
            <div className="border rounded-md bg-gray-50 p-3">
              <code className="block">
                {shortenString(wallets?.did ?? "-")}
              </code>
            </div>
          </div>

          {/* credentials section */}
          <div className="space-y-2">
            <h2 className="font-bold">Your credentials</h2>

            {requestCredentialEnabled && (
              <Button
                loading={claimCredentialPending}
                onClick={() => claimCredential()}
                className="btn btn-neutral w-full"
              >
                Request KYCAgeCredential credential
              </Button>
            )}

            <ul className="space-y-2">
              {credentials.map((credential) => (
                <li
                  key={credential.id}
                  className="border rounded-md bg-gray-50 p-3"
                >
                  <code className="block">{shortenString(credential.id)}</code>
                  <code className="block">
                    {shortenString(credential.issuer)}
                  </code>
                  <code className="block">{credential.type}</code>
                  <code className="block">{credential.issuanceDate}</code>
                </li>
              ))}
            </ul>
          </div>

          {/* airdrop section */}
          <div className="space-y-2">
            <h2 className="font-bold">ERC20 Airdrop</h2>

            {requestAirdropEnabled && (
              <Button
                loading={claimAirdropPending}
                onClick={() => claimAirdrop()}
                className="btn btn-neutral w-full"
              >
                Request airdrop
              </Button>
            )}

            {zkpRequestLoading ? (
              <p>Loading...</p>
            ) : (
              <>
                <div className="border rounded-md bg-gray-50 p-3 overflow-x-scroll">
                  <code>
                    Balance:{" "}
                    {formatUnits(
                      zkpRequest?.balance ?? 0,
                      OPID_AIRDROP_DECIMALS
                    )}
                  </code>
                </div>
                <div className="border rounded-md bg-gray-50 p-3 overflow-x-scroll">
                  <code>
                    Verified: {String(zkpRequest?.isVerified ?? false)}
                  </code>
                </div>
                <div className="border rounded-md bg-gray-50 p-3 overflow-x-scroll">
                  <code>Token: {OPID_AIRDROP_ADDRESS}</code>
                </div>
                <div className="border rounded-md bg-gray-50 p-3 overflow-x-scroll">
                  <code>
                    Metadata: <br /> {JSON.stringify(zkpRequest?.metadata)}
                  </code>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
