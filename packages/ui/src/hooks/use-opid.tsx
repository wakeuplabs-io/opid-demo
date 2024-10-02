import { Storage, StorageService } from "@/services/storage";
import { Wallets, WalletService } from "@/services/wallet";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { W3CCredential } from "@wakeuplabs/opid-sdk";

// Define the shape of the context value
interface OpIdContextType {
  storage?: Storage;
  wallets?: Wallets;
  credentials: W3CCredential[];
  saveCredentials: (credentials: W3CCredential[]) => Promise<void>;
}

// Create the Context with a default value
const OpIdContext = createContext<OpIdContextType | undefined>(
  undefined
);

// Create a Provider component
export const OpIdProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [storage, setStorage] = useState<Storage | undefined>();
  const [wallets, setWallets] = useState<Wallets | undefined>();
  const [credentials, setCredentials] = useState<W3CCredential[]>([]);

  useEffect(() => {
    async function init() {
      const storage = await StorageService.init();
      const wallets = await WalletService.init(storage);
      const credentials = await wallets.credentials.list();

      setStorage(storage);
      setWallets(wallets);
      setCredentials(credentials);
    }

    init();
  }, []);

  const saveCredentials = async (creds: W3CCredential[]) => {
    await wallets?.credentials.saveAll(creds);
    setCredentials([...credentials, ...creds]);
  };

  return (
    <OpIdContext.Provider value={{ storage, wallets, credentials, saveCredentials }}>
      {children}
    </OpIdContext.Provider>
  );
};

export const useOpId = (): OpIdContextType => {
  const context = useContext(OpIdContext);
  if (!context) {
    throw new Error("useOpIdAirdrop must be used within a OpIdAirdropProvider");
  }
  return context;
};
