// @ts-nocheck

import { testnet } from "@recallnet/chains";
import { RecallClient } from "@recallnet/sdk/client";
import { createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const privateKey = process.env.RECALL_PRIVATE_KEY!;
const walletClient = createWalletClient({
  account: privateKeyToAccount(privateKey),
  chain: testnet,
  transport: http(),
});

const client = new RecallClient({ walletClient });

async function purchaseCredit() {
  const creditManager = client.creditManager();
  const { meta: creditMeta } = await creditManager.buy(parseEther("1"));
  console.log("Credit purchased at:", creditMeta?.tx?.transactionHash);
}

async function createBucket() {
  const bucketManager = client.bucketManager();
  const {
    result: { bucket },
  } = await bucketManager.create();
  console.log("Bucket created:", bucket);
  return bucket;
}

// Simulate adding context to a bucket
async function addContext(bucket: string, key: string, content: string) {
  const bucketManager = client.bucketManager();
  const file = new File([new TextEncoder().encode(content)], `${key}.txt`, {
    type: "text/plain",
  });
  const { meta: addMeta } = await bucketManager.add(bucket, key, file);
  console.log("Context added at:", addMeta?.tx?.transactionHash);
}

// Simulate querying context
async function queryContext(bucket: string, prefix: string) {
  const bucketManager = client.bucketManager();
  const {
    result: { objects },
  } = await bucketManager.query(bucket, { prefix });
  console.log("Queried objects:", objects);
}

// Simulate retrieving context
async function getContext(bucket: string, key: string) {
  const bucketManager = client.bucketManager();
  const { result: object } = await bucketManager.get(bucket, key);
  const contents = new TextDecoder().decode(object);
  console.log("Retrieved contents:", contents);
}

// Export functions for simulated usage
export { purchaseCredit, createBucket, addContext, queryContext, getContext };
