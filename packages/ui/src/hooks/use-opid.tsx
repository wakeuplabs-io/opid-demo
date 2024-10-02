import { Storage, StorageService } from "@/services/storage";
import { Wallets, WalletService } from "@/services/wallet";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

// Define the shape of the context value
interface OpIdContextType {
  storage?: Storage;
  wallets?: Wallets;
}

// Create the Context with a default value
const OpIdContext = createContext<OpIdContextType | undefined>(undefined);

// Create a Provider component
export const OpIdProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [storage, setStorage] = useState<Storage | undefined>();
  const [wallets, setWallets] = useState<Wallets | undefined>();

  useEffect(() => {
    async function init() {
      const storage = StorageService.init();
      const wallets = await WalletService.init(storage);

      setStorage(storage);
      setWallets(wallets);
    }

    init();
  }, []);

  return (
    <OpIdContext.Provider value={{ storage, wallets }}>
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
