export const RHS_URL = "http://a009ec078484b45e5b233cc29eab9f83-ff4fb4ecca77ee61.elb.us-east-1.amazonaws.com";
export const OPID_BLOCKCHAIN = "optimism";
export const OPID_NETWORK = "sepolia";
export const OPID_CHAIN_ID = 11155420;
export const RPC_URL = import.meta.env.VITE_RPC_URL;

export const defaultEthConnectionConfig =  [{
  url: RPC_URL,
  defaultGasLimit: 600000,
  minGasPrice: "0",
  maxGasPrice: "100000000000",
  confirmationBlockCount: 5,
  confirmationTimeout: 600000,
  contractAddress: "0x9a1A258702050BcFB938Ad8Ec0996503473216d1",
  receiptTimeout: 600000,
  rpcResponseTimeout: 5000,
  waitReceiptCycleTime: 30000,
  waitBlockCycleTime: 3000,
  chainId: OPID_CHAIN_ID
}];


