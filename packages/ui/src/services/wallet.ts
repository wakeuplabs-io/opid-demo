import { defaultEthConnectionConfig, OPID_BLOCKCHAIN, OPID_NETWORK, RHS_URL } from "@/constants/common";
import { AgentResolver, BjjProvider, CredentialStatusResolverRegistry, CredentialStatusType, CredentialStorage, CredentialWallet, EthStateStorage, IdentityStorage, IdentityWallet, IndexedDBDataSource, IndexedDBPrivateKeyStore, IssuerResolver, KMS, KmsKeyType, MerkleTreeIndexedDBStorage, OnChainResolver, OPID_METHOD, RHSResolver } from "@wakeuplabs/opid-sdk";

export class WalletService {
  static async createWallet() {
    const keyStore = new IndexedDBPrivateKeyStore();
    const bjjProvider = new BjjProvider(KmsKeyType.BabyJubJub, keyStore);
    
    const kms = new KMS();
    kms.registerKeyProvider(KmsKeyType.BabyJubJub, bjjProvider);

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

    const resolvers = new CredentialStatusResolverRegistry();
    resolvers.register(
      CredentialStatusType.SparseMerkleTreeProof,
      new IssuerResolver()
    );
    resolvers.register(
      CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
      new RHSResolver(dataStorage.states)
    );
    resolvers.register(
      CredentialStatusType.Iden3OnchainSparseMerkleTreeProof2023,
      new OnChainResolver(defaultEthConnectionConfig)
    );
    resolvers.register(
      CredentialStatusType.Iden3commRevocationStatusV1,
      new AgentResolver()
    );

    const credWallet = new CredentialWallet(dataStorage, resolvers);
    const wallet = new IdentityWallet(kms, dataStorage, credWallet);

    const identities = await dataStorage.identity.getAllIdentities();
    let did = identities.length ? identities[0].did : undefined;
    if (!did) {
      const identity = await wallet.createIdentity({
        method: OPID_METHOD,
        blockchain: OPID_BLOCKCHAIN,
        networkId: OPID_NETWORK,
        revocationOpts: {
          type: CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
          id: RHS_URL
        }
      });
      did = identity.did.string();
    }

    return {
      did,
      kms: kms,
      wallet: wallet,
      credWallet: credWallet,
      dataStorage: dataStorage
    };
  }
}
