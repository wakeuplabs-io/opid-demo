import { defaultEthConnectionConfig } from "@/constants";
import {  CircuitStorage, CredentialStorage, EthStateStorage, ICircuitStorage, ICredentialStorage, IdentityStorage, IIdentityStorage, IMerkleTreeStorage, IndexedDBDataSource, IStateStorage, MerkleTreeIndexedDBStorage } from "@wakeuplabs/opid-sdk";


export type Storage = {
    credential: ICredentialStorage;
    identity: IIdentityStorage;
    mt: IMerkleTreeStorage;
    circuits: ICircuitStorage;
    states: IStateStorage;
}

export class StorageService {
  static init(): Storage {
    const dataStorage = {
      credential: new CredentialStorage(
        new IndexedDBDataSource(CredentialStorage.storageKey)
      ),
      identity: new IdentityStorage(
        new IndexedDBDataSource(IdentityStorage.identitiesStorageKey),
        new IndexedDBDataSource(IdentityStorage.profilesStorageKey)
      ),
      mt: new MerkleTreeIndexedDBStorage(40),
      circuits: new CircuitStorage(
        new IndexedDBDataSource(CircuitStorage.storageKey)
      ),
      states: new EthStateStorage(defaultEthConnectionConfig[0])

    };
    return dataStorage;
  }
}