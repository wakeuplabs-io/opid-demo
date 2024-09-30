import { useEffect, useState } from "react";
import { useEthersSigner } from "./use-ethers-signer";
import { useOpId } from "./use-opid";
import { AirdropService } from "@/services/airdrop";
import { AIRDROP_REQUEST_ID, ERC20_VERIFIER_DID, OPID_AIRDROP_ADDRESS } from "@/constants/airdrop";

export const useOpIdAirdrop = () => {
  const signer = useEthersSigner();
  const { storage, wallets } = useOpId();
  const [airdrop, setAirdrop] = useState<AirdropService | undefined>();
  
  useEffect(() => {
    if (!storage || !wallets || !signer) return;
  
    setAirdrop(
      new AirdropService(
        AIRDROP_REQUEST_ID,
        ERC20_VERIFIER_DID,
        OPID_AIRDROP_ADDRESS,
        signer,
        wallets.identity,
        wallets.credentials,
        storage.circuits,
        storage.states
      )
    );
  }, [storage, wallets, signer]);
  
  return { airdrop };
};
  