import { defaultEthConnectionConfig } from "@/constants";
import {  CircuitId, CircuitStorage, CredentialStorage, EthStateStorage, ICircuitStorage, ICredentialStorage, IdentityStorage, IIdentityStorage, IMerkleTreeStorage, IndexedDBDataSource, IStateStorage, MerkleTreeIndexedDBStorage } from "@wakeuplabs/opid-sdk";


export type Storage = {
    credential: ICredentialStorage;
    identity: IIdentityStorage;
    mt: IMerkleTreeStorage;
    circuits: ICircuitStorage;
    states: IStateStorage;
}

export class StorageService {
  static async init(): Promise<Storage> {
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

    // load circuits
    const [v3_w, v3_z, v3_j] = await Promise.all([
      fetch(`./${CircuitId.AtomicQueryV3OnChain}/circuit.wasm`)
        .then((response) => response.arrayBuffer())
        .then((buffer) => new Uint8Array(buffer)),
      fetch(`./${CircuitId.AtomicQueryV3OnChain}/circuit_final.zkey`)
        .then((response) => response.arrayBuffer())
        .then((buffer) => new Uint8Array(buffer)),
      fetch(`./${CircuitId.AtomicQueryV3OnChain}/verification_key.json`)
        .then((response) => response.arrayBuffer())
        .then((buffer) => new Uint8Array(buffer)),
    ]);

    await dataStorage.circuits.saveCircuitData(CircuitId.AtomicQueryV3OnChain, {
      circuitId: CircuitId.AtomicQueryV3OnChain,
      wasm: v3_w,
      provingKey: v3_z,
      verificationKey: v3_j,
    });

    return dataStorage;
  }
}