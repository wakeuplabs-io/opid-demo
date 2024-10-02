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

interface OpIdContextType {
  storage?: Storage;
  wallets?: Wallets;
  credentials: W3CCredential[];
  saveCredentials: (credentials: W3CCredential[]) => Promise<void>;
}

const OpIdContext = createContext<OpIdContextType | undefined>(
  undefined
);

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

  const saveCredentials = async (credentials: W3CCredential[]) => {
    await wallets?.credentials.saveAll(credentials);
    setCredentials((creds) => [...credentials, ...creds]);
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
    throw new Error("useOpId must be used within a OpIdProvider");
  }
  return context;
};
