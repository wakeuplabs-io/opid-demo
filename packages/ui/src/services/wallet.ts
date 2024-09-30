import { defaultEthConnectionConfig, OPID_BLOCKCHAIN, OPID_NETWORK, RHS_URL } from "@/constants/common";
import { AgentResolver, BjjProvider, CredentialStatusResolverRegistry, CredentialStatusType, CredentialWallet, IdentityWallet, IndexedDBPrivateKeyStore, IssuerResolver, KMS, KmsKeyType, OnChainResolver, OPID_METHOD, RHSResolver } from "@wakeuplabs/opid-sdk";
import { Storage } from "./storage";

export type Wallets = {
  did: string,
  kms: KMS,
  wallet: IdentityWallet,
  credentials: CredentialWallet,
}

export class WalletService {
  static async init(storage: Storage): Promise<Wallets> {
    const keyStore = new IndexedDBPrivateKeyStore();
    const bjjProvider = new BjjProvider(KmsKeyType.BabyJubJub, keyStore);

    const kms = new KMS();
    kms.registerKeyProvider(KmsKeyType.BabyJubJub, bjjProvider);

    const resolvers = new CredentialStatusResolverRegistry();
    resolvers.register(
      CredentialStatusType.SparseMerkleTreeProof,
      new IssuerResolver()
    );
    resolvers.register(
      CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
      new RHSResolver(storage.states)
    );
    resolvers.register(
      CredentialStatusType.Iden3OnchainSparseMerkleTreeProof2023,
      new OnChainResolver(defaultEthConnectionConfig)
    );
    resolvers.register(
      CredentialStatusType.Iden3commRevocationStatusV1,
      new AgentResolver()
    );

    const credWallet = new CredentialWallet(storage, resolvers);
    const wallet = new IdentityWallet(kms, storage, credWallet);

    const identities = await storage.identity.getAllIdentities();
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
      credentials: credWallet,
    };
  }
}
