import {
  AIRDROP_REQUEST_ID,
  ERC20_VERIFIER_DID,
  OPID_AIRDROP_ADDRESS,
} from "@/constants/airdrop";
import { AirdropService } from "@/services/airdrop";
import { Storage, StorageService } from "@/services/storage";
import { Wallets, WalletService } from "@/services/wallet";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useEthersSigner } from "./use-ethers-signer";
import { W3CCredential } from "@wakeuplabs/opid-sdk";

// Define the shape of the context value
interface OpIdAirdropContextType {
  storage?: Storage;
  wallets?: Wallets;
  credentials: W3CCredential[];
}

// Create the Context with a default value
const OpIdAirdropContext = createContext<OpIdAirdropContextType | undefined>(
  undefined
);

// Create a Provider component
export const OpIdAirdropProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [storage, setStorage] = useState<Storage | undefined>();
  const [wallets, setWallets] = useState<Wallets | undefined>();
  const [credentials, setCredentials] = useState<W3CCredential[]>([]);

  useEffect(() => {
    async function init() {
      const storage = StorageService.init();
      const wallets = await WalletService.init(storage);
      const credentials = await wallets.credentials.list();

      setStorage(storage);
      setWallets(wallets);
      setCredentials(credentials);
    }

    init();
  }, []);

  return (
    <OpIdAirdropContext.Provider value={{ storage, wallets, credentials }}>
      {children}
    </OpIdAirdropContext.Provider>
  );
};

export const useOpId = (): OpIdAirdropContextType => {
  const context = useContext(OpIdAirdropContext);
  if (!context) {
    throw new Error("useOpIdAirdrop must be used within a OpIdAirdropProvider");
  }
  return context;
};

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
