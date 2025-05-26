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
    return await this.api.post(`/identities/${this.issuerDid}/credentials`, {
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
    // Add a delay to give the issuer time to process the credential
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const response = await this.api.get(`/identities/${this.issuerDid}/credentials`, {
        params: { schemaType: "KYCAgeCredential", subject: userDid, revoked }
      });


      const items = response.data?.items || [];

      if (items.length === 0) {
        console.warn("No KYCAgeCredential found for this user. This might be because the credential is still being processed.");
      }

      const credentials = items.map((item: any) => {
        const credential = W3CCredential.fromJSON(item.vc);
        return credential;
      });

      return credentials;
    } catch (error) {
      console.error("Error retrieving or processing credentials:", error);
      throw error;
    }
  }
}

export const kycAgeClaimIssuer = new KycAgeClaimIssuer(
  import.meta.env.VITE_ISSUER_URL,
  import.meta.env.VITE_ISSUER_DID,
  import.meta.env.VITE_ISSUER_USER,
  import.meta.env.VITE_ISSUER_PASSWORD
); 