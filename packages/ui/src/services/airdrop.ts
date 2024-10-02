import { ethers, getBytes, hexlify } from "ethers";
import { CircuitId, core, ICircuitStorage, ICredentialWallet, IdentityWallet, IStateStorage, ProofService, ZeroKnowledgeProofResponse } from "@wakeuplabs/opid-sdk";
import { Erc20AirdropAbi } from "@/constants/abis";

export class AirdropService {
  private readonly REQUEST_ID: number;
  private readonly ERC20_VERIFIER_DID: core.DID;

  private readonly proofService: ProofService;
  private readonly airdrop: ethers.Contract;

  constructor(
    requestId: number,
    erc20VerifierDid: core.DID,
    airdropAddress: string,
    ethersSigner: ethers.JsonRpcSigner,
    identityWallet: IdentityWallet,
    credentialWallet: ICredentialWallet,
    circuitStorage: ICircuitStorage,
    stateStorage: IStateStorage
  ) {

    this.REQUEST_ID = requestId;
    this.ERC20_VERIFIER_DID = erc20VerifierDid;

    // const prov = new ethers.JsonRpcProvider("https://opt-sepolia.g.alchemy.com/v2/NvmmU_WYKNBUlmYf1NqM6T_jvEBF5x7l")
    this.airdrop = new ethers.Contract(airdropAddress, Erc20AirdropAbi, ethersSigner);
    this.proofService = new ProofService(identityWallet, credentialWallet, circuitStorage, stateStorage, {
      ipfsGatewayURL: "https://ipfs.io"
    });
  }

  generateProof(userDID: core.DID, userAddress: string): Promise<ZeroKnowledgeProofResponse> {
    return this.proofService.generateProof(
      {
        id: this.REQUEST_ID,
        circuitId: CircuitId.AtomicQueryV3OnChain,
        optional: false,
        query: {
          allowedIssuers: ["*"],
          context:
            "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld",
          credentialSubject: { birthday: { $lt: 20020101 } },
          type: "KYCAgeCredential",
          proofType: 0,
          skipClaimRevocationCheck: false
        },
        params: { nullifierSessionId: 0 }
      },
      userDID,
      {
        verifierDid: this.ERC20_VERIFIER_DID,
        challenge: this.generateChallenge(userAddress),
        skipRevocation: false
      }
    );
  }

  async submitPoof(requestId: number, proofData: ZeroKnowledgeProofResponse): Promise<string> {
    const { inputs, pi_a, pi_b, pi_c } = this.prepareProofInputs(proofData);

    const submitZkpResponseTx = await this.airdrop.submitZKPResponse(
      requestId,
      inputs,
      pi_a,
      pi_b,
      pi_c
    );
    await submitZkpResponseTx.wait();

    return submitZkpResponseTx.hash;
  }

  async getAirdropStatus(requestId: number, userAddress: string) {
    const [request, status, balance] = await Promise.all([
      this.airdrop.getZKPRequest(requestId),
      this.airdrop.getProofStatus(userAddress, requestId),
      this.airdrop.balanceOf(userAddress)
    ]);

    return { metadata: JSON.parse(request.metadata), balance: BigInt(balance), isVerified: status.isVerified };
  }

  balanceOf(address: string) {
    return this.airdrop.balanceOf(address);
  }

  private generateChallenge(address: string): bigint {
    function padRightToUint256(bytes: Uint8Array) {
      const paddedBytes = new Uint8Array(32);
      paddedBytes.set(bytes, 0);
      return BigInt(hexlify(paddedBytes));
    }

    function reverseUint256(input: bigint) {
      // mask to restrict to 256 bits
      const MASK_256 = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
      let v = BigInt(input);

      // Swap bytes
      v =
        ((v & BigInt("0xFF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00")) >> 8n) |
        ((v & BigInt("0x00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF")) << 8n);
      v &= MASK_256;

      // Swap 2-byte long pairs
      v =
        ((v & BigInt("0xFFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000")) >> 16n) |
        ((v & BigInt("0x0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF")) << 16n);
      v &= MASK_256;

      // Swap 4-byte long pairs
      v =
        ((v & BigInt("0xFFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000")) >> 32n) |
        ((v & BigInt("0x00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF")) << 32n);
      v &= MASK_256;

      // Swap 8-byte long pairs
      v =
        ((v & BigInt("0xFFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF0000000000000000")) >> 64n) |
        ((v & BigInt("0x0000000000000000FFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF")) << 64n);
      v &= MASK_256;

      // Swap 16-byte long pairs
      v = ((v >> 128n) | (v << 128n)) & MASK_256;

      return v;
    }

    return reverseUint256(padRightToUint256(getBytes(address)));
  }

  private prepareProofInputs(proofData: ZeroKnowledgeProofResponse): {
    inputs: string[];
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
  } {
    const { proof, pub_signals } = proofData;
    const { pi_a, pi_b, pi_c } = proof;
    const [[p1, p2], [p3, p4]] = pi_b;
    const preparedProof = {
      pi_a: pi_a.slice(0, 2),
      pi_b: [
        [p2, p1],
        [p4, p3]
      ],
      pi_c: pi_c.slice(0, 2)
    };

    return { inputs: pub_signals, ...preparedProof };
  }


}
