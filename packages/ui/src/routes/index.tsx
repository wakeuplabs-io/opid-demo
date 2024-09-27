import { WalletService } from "@/services/wallet";
import { createFileRoute } from "@tanstack/react-router";
import { W3CCredential } from "@wakeuplabs/opid-sdk";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [did, setDid] = useState("");
  const [credentials, setCredentials] = useState<W3CCredential[]>([]);

  useEffect(() => {
    WalletService.createWallet().then(r => {
      r.dataStorage.identity.getAllIdentities()
        .then((identities) => setDid(identities.find(i => i.did.startsWith("did:opid:"))?.did || ""));
      r.credWallet.list().then(setCredentials);
    });
  }, []);

  return (
    <div className="max-w-xl mx-auto text-center space-y-10 py-10">
      <div>
        <h2 className="font-bold text-xl ">OPID ERC20 Airdrop demo</h2>
        <p>This demo leverages the OPID identity system to generate and distribute OPID Airdrops to users that have a valid KYC credential.</p>
      </div>

      <div className="space-y-2">
        <h2>Your wallet data for this demo.</h2>
        <div className="border rounded-md bg-gray-50 p-3">
          <code className="block">{shortenString(did)}</code>
          {/* TODO: add copy button */}
        </div>
      </div>

      <div className="space-y-2">
        <h2>Your credentials.</h2>
        <button className="btn btn-neutral w-full">Request KYCAgeCredential credential</button>
        {credentials.map((credential) => (
          <div className="border rounded-md bg-gray-50 p-3" key={credential.id}>
            <code className="block">{shortenString(credential.id)}</code>
            <code className="block">{shortenString(credential.issuer)}</code>
            <code className="block">{credential.type}</code>
            <code className="block">{credential.issuanceDate}</code>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h2>ERC20 Airdrop</h2>
        <button className="btn btn-neutral w-full">Request airdrop</button>
        <div className="border rounded-md bg-gray-50 p-3">
          <code className="block">Proof status and other details...</code>
        </div>
      </div>
    </div>
  );
}

function shortenString(str: string) {
  return str.slice(0, 10) + "..." + str.slice(-10);
}