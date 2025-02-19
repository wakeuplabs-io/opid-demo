import { buildVerifierId, core, OPID_METHOD } from "@wakeuplabs/opid-sdk";
import { OPID_BLOCKCHAIN, OPID_NETWORK } from "./opid";

export const AIRDROP_REQUEST_ID = 1;

// export const OPID_AIRDROP_ADDRESS = "0x9001f41Fbe63fF09635Fe8Dfc532035BA34348B9";
export const OPID_AIRDROP_ADDRESS = "0xca6bfa62791d3c7c7ed1a5b320018c1C1dAC89Ee";
export const OPID_AIRDROP_DECIMALS = 18;

export const ERC20_VERIFIER_ID = buildVerifierId(OPID_AIRDROP_ADDRESS, {
  blockchain: OPID_BLOCKCHAIN,
  networkId: OPID_NETWORK,
  method: OPID_METHOD
});

export const ERC20_VERIFIER_DID = core.DID.parseFromId(ERC20_VERIFIER_ID);
