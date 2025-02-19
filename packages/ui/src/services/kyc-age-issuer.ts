import { W3CCredential } from "@wakeuplabs/opid-sdk";
import axios, { AxiosInstance } from "axios";

export class KycAgeClaimIssuer {
  private api: AxiosInstance;
  private readonly issuerDid: string;

  constructor(baseUrl: string, issuerDid: string, issuerUser: string, issuerPassword: string) {
    this.api = axios.create({ baseURL: baseUrl, auth: { username: issuerUser, password: issuerPassword } });
    this.issuerDid = issuerDid;
  }

  async createKycAgeClaim(userDid: string, birthday: number): Promise<void> {
    await this.api.post(`/${this.issuerDid}/claims`, {
      "credentialSchema": 'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json/KYCAgeCredential-v3.json',
      "type": "KYCAgeCredential",
      "credentialSubject": {
        "id": userDid,
        "birthday": birthday,
        "documentType": 99
      },
    });
  }

  async getKycAgeClaims(userDid: string, revoked: boolean = false): Promise<W3CCredential[]> {
    const claims = await this.api.get(`/${this.issuerDid}/claims`, {
      params: { schemaType: "KYCAgeCredential", subject: userDid, revoked }
    });

    return claims.data.map((claim: unknown) =>  W3CCredential.fromJSON(claim));
  }
}

export const kycAgeClaimIssuer = new KycAgeClaimIssuer(
  import.meta.env.VITE_ISSUER_URL,
  import.meta.env.VITE_ISSUER_DID,
  import.meta.env.VITE_ISSUER_USER,
  import.meta.env.VITE_ISSUER_PASSWORD
);

