require('dotenv').config()

import { Chain } from "@defillama/sdk/build/general";
import vaultABI from './Vault.abi.json'
import { ethers } from "ethers";
import { Interface } from "ethers/lib/utils";

const GETBLOCK_API_KEY = process.env.GETBLOCK_API_KEY
const RPC_URL = `https://bsc.getblock.io/mainnet/?api_key=${GETBLOCK_API_KEY}`
const VAULT_ADDRESS = '0x158da805682bdc8ee32d52833ad41e74bb951e59'
const WORKER_TOPIC = '0x73c4ef442856bea52a6b34a83f35484ee65828010254ec27766c5a8c13db6c84'

export const getPositionIds = async (account: string, block = 'latest', chain: Chain = 'bsc'): Promise<any> => {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL)

  // 1. Get all transactions from account address.
  // TODO

  // 2. Get `txHash`, `blockNumber` that interact with `VAULT_ADDRESS`.
  const blockNumber = '0x98172b'

  // 3. Get log from `txHash`, `blockNumber`.
  const result = await provider.getLogs({
    address: VAULT_ADDRESS,
    fromBlock: blockNumber,
    toBlock: blockNumber,
    topics: [
      WORKER_TOPIC,
    ]
  });

  // 4. Get `positionId` from 
  const iface = new Interface(vaultABI);
  const result2 = iface.decodeEventLog("Work", result[0].data, result[0].topics);
  console.log('position id:', parseInt(result2.id))

  return [parseInt(result2.id)]
}