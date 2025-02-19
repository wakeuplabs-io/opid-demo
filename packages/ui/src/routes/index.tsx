import {
  AIRDROP_REQUEST_ID,
  OPID_AIRDROP_ADDRESS,
  OPID_AIRDROP_DECIMALS,
} from "@/constants/airdrop";
import { useOpIdAirdrop } from "@/hooks/use-opid-airdrop";
import { useOpId } from "@/hooks/use-opid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAccount } from "wagmi";
import { core } from "@wakeuplabs/opid-sdk";
import { formatUnits } from "ethers";
import { kycAgeClaimIssuer } from "@/services/kyc-age-issuer";
import { Button } from "@/components/ui/button";
import { ConnectWalletButton } from "@/components/connect-wallet";
import { CopyButton } from "@/components/copy-button";
import { shortenString } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { airdrop } = useOpIdAirdrop();
  const { wallets, credentials, saveCredentials } = useOpId();

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

      // We can only claim airdrop once per did
      window.localStorage.setItem(wallets!.did, address!);

      alert("Airdrop request was successful");
    },
    onError: (e) => {
      console.error(e);
      alert("Airdrop request failed");
    },
  });

  const claimedAddress = useMemo(() => {
    if (!wallets?.did) return "0x0";
    return window.localStorage.getItem(wallets?.did);
  }, [wallets?.did]);

  const kycAgeCredential = useMemo(() => {
    return credentials.find((c) => c.type.includes("KYCAgeCredential"));
  }, [credentials]);

  // block request airdrop if we already verified the proof. tx would fail anyways, this is just ux
  const requestAirdropEnabled = useMemo(() => {
    return !(
      zkpRequest?.isVerified ||
      zkpRequestLoading ||
      claimedAddress == address
    );
  }, [zkpRequest, zkpRequestLoading, claimedAddress, address]);

  return (
    <div className="max-w-xl mx-auto w-full text-center space-y-10 py-10 px-4">
      <div>
        <h2 className="font-bold text-xl">OPID ERC20 Airdrop demo</h2>
        <p>
          This demo leverages the OPID identity system to generate and
          distribute tokens to users that have a valid KYC Age credential.
        </p>
      </div>

      <>
        {/* did section */}
        <div className="space-y-2">
          <h2 className="font-bold">Your DID</h2>
          <div className="border rounded-md bg-gray-50 p-3 relative text-start">
            <code className="block overflow-clip">{wallets?.did ?? "-"}</code>
            <CopyButton
              value={wallets?.did}
              className="absolute right-1 top-1/2 -translate-y-1/2"
            />
          </div>
        </div>

        {/* credentials section */}
        <div className="space-y-2">
          <h2 className="font-bold">Your KycAge credential</h2>

          {kycAgeCredential ? (
            <div className="border rounded-md bg-gray-50 p-3 text-start">
              <code className="block">
                Id: {shortenString(kycAgeCredential.id)}
              </code>
              <code className="block">
                Issuer:
                {shortenString(kycAgeCredential.issuer)}
              </code>
              <code className="block">Type: {kycAgeCredential.type}</code>
              <code className="block">
                IssuanceDate: {kycAgeCredential.issuanceDate}
              </code>
            </div>
          ) : (
            <>
              <Button
                loading={claimCredentialPending}
                onClick={() => claimCredential()}
                className="btn btn-neutral w-full"
              >
                Request KYCAgeCredential credential
              </Button>
              <div className="border rounded-md bg-gray-50 p-3 text-center">
                No credential found
              </div>
            </>
          )}
        </div>

        {/* airdrop section */}

        <div className="space-y-2">
          <h2 className="font-bold">ERC20 Airdrop</h2>
          {kycAgeCredential === undefined ? (
            <div className="border rounded-md bg-gray-50 p-3 text-center">
              Claim KYCAgeCredential credential before requesting airdrop
            </div>
          ) : (
            <>
              <ConnectWalletButton />
              
              {address && (
                <>
                  {requestAirdropEnabled && (
                    <Button
                      loading={claimAirdropPending}
                      onClick={() => claimAirdrop()}
                      className="btn btn-neutral w-full"
                    >
                      Request Airdrop
                    </Button>
                  )}

                  {zkpRequestLoading ? (
                    <p>Loading...</p>
                  ) : (
                    <div className="text-start space-y-2">
                      {claimedAddress && claimedAddress !== "0x0" && (
                        <div className="text-center mb-6">
                          Claimed with address: {shortenString(claimedAddress)}
                        </div>
                      )}

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
                      <div className="border rounded-md bg-gray-50 p-3 overflow-x-scroll relative">
                        <code>
                          Token: {shortenString(OPID_AIRDROP_ADDRESS)}
                        </code>
                        <CopyButton
                          value={OPID_AIRDROP_ADDRESS}
                          className="absolute right-1 top-1/2 -translate-y-1/2"
                        />
                      </div>
                      <div className="border rounded-md bg-gray-50 p-3 overflow-x-scroll relative">
                        <code>
                          Metadata: <br /> <br />{" "}
                          {JSON.stringify(zkpRequest?.metadata)}
                        </code>
                        <CopyButton
                          value={JSON.stringify(zkpRequest?.metadata)}
                          className="absolute right-1 top-1"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </>
    </div>
  );
}
