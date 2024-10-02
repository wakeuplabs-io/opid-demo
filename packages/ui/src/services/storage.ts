import { defaultEthConnectionConfig } from "@/constants/common";
import {  CredentialStorage, EthStateStorage, IdentityStorage, IndexedDBDataSource, MerkleTreeIndexedDBStorage } from "@wakeuplabs/opid-sdk";


export type Storage = {
    credential: CredentialStorage;
    identity: IdentityStorage;
    mt: MerkleTreeIndexedDBStorage;
    states: EthStateStorage;
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
      states: new EthStateStorage(defaultEthConnectionConfig[0])

    };
    return dataStorage;
  }
}