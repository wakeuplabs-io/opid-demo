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
    try {
      if (!wallets) {
        console.error("Cannot save credentials: wallets not initialized");
        return;
      }
      
      await wallets.credentials.saveAll(credentials);
      
      setCredentials((currentCreds) => {
        const existingIds = new Set(currentCreds.map(cred => cred.id));
        const uniqueNewCreds = credentials.filter(cred => !existingIds.has(cred.id));
        const updatedCreds = [...currentCreds, ...uniqueNewCreds];
        
        return updatedCreds;
      });
    } catch (error) {
      console.error("Failed to save credentials:", error);
      throw error;
    }
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
