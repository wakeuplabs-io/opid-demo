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

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { airdrop } = useOpIdAirdrop();
  const { wallets, credentials, saveCredentials } = useOpId();

  const { data: zkpRequest, isLoading: zkpRequestLoading } = useQuery({
    enabled: !!airdrop && !!address,
    queryKey: ["zkp-request", address ?? "0x"],
    queryFn: () => {
      if (!airdrop || !address) return;
      return airdrop.getAirdropStatus(AIRDROP_REQUEST_ID, address);
    },
  });

  const { mutate: claimCredential, isPending: claimCredentialPending } =
    useMutation({
      mutationFn: async () => {
        if (!wallets || !credentials) return;

        // create credential
        await kycAgeClaimIssuer.createKycAgeClaim(wallets.did, 19960424);
        console.log("created");

        // publish state
        const txID = await kycAgeClaimIssuer.publishIssuerState();
        console.log("txID", txID);

        // fetch and save credentials
        const kycAgeCredentials = await kycAgeClaimIssuer.getKycAgeClaims(
          wallets.did
        );
        console.log("kycAgeCredentials", kycAgeCredentials);
        await saveCredentials(kycAgeCredentials);
      },
      onSuccess: () => alert("Credential claim was successful"),
      onError: () => alert("Credential claim failed"),
    });

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
    onError: (e) => {
      alert("Airdrop request failed");
      console.log(e);
    },
  });

  const copyDidToClipboard = useCallback(() => {
    navigator.clipboard.writeText(wallets?.did ?? "");

    alert("DID copied to clipboard");
  }, [wallets?.did]);

  const requestAirdropEnabled = useMemo(() => {
    return !(zkpRequest?.isVerified || zkpRequestLoading);
  }, [zkpRequest, zkpRequestLoading]);

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
          <ConnectButton />
        </div>
      </div>

      {address && (
        <>
          <div className="space-y-2">
            <h2>Your DID</h2>
            <button
              onClick={copyDidToClipboard}
              className="btn btn-neutral w-full"
            >
              Copy DID
            </button>
            <div className="border rounded-md bg-gray-50 p-3">
              <code className="block">{shortenString(wallets?.did ?? "")}</code>
            </div>
          </div>

          <div className="space-y-2">
            <h2>Your credentials</h2>
            {requestCredentialEnabled && (
              <button
                disabled={claimCredentialPending}
                onClick={() => claimCredential()}
                className="btn btn-neutral w-full"
              >
                {claimCredentialPending && (
                  <span className="loading loading-sm loading-spinner"></span>
                )}
                Request KYCAgeCredential credential
              </button>
            )}
            {credentials.map((credential) => (
              <div
                className="border rounded-md bg-gray-50 p-3"
                key={credential.id}
              >
                <code className="block">{shortenString(credential.id)}</code>
                <code className="block">
                  {shortenString(credential.issuer)}
                </code>
                <code className="block">{credential.type}</code>
                <code className="block">{credential.issuanceDate}</code>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h2>ERC20 Airdrop</h2>
            {requestAirdropEnabled && (
              <button
                disabled={claimAirdropPending}
                onClick={() => claimAirdrop()}
                className="btn btn-neutral w-full"
              >
                {claimAirdropPending && (
                  <span className="loading loading-sm loading-spinner"></span>
                )}
                Request airdrop
              </button>
            )}
            <div className="border rounded-md bg-gray-50 p-3 overflow-x-scroll">
              {zkpRequestLoading ? (
                <p>Loading...</p>
              ) : (
                <>
                  <code className="block">
                    Balance:{" "}
                    {formatUnits(
                      zkpRequest?.balance ?? 0,
                      OPID_AIRDROP_DECIMALS
                    )}
                  </code>
                  <code className="block">
                    Verified: {String(zkpRequest?.isVerified ?? false)}
                  </code>
                  <code className="block">Token: {OPID_AIRDROP_ADDRESS}</code>
                  <code className="block">
                    Metadata: <br /> {JSON.stringify(zkpRequest?.metadata)}
                  </code>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
