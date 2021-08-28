require('dotenv').config()

import { Chain } from "@defillama/sdk/build/general";
import { ethers } from "ethers";
import { Interface } from "ethers/lib/utils";
import { getWorkEvent } from "../vaults/vaultEvent";

const GETBLOCK_API_KEY = process.env.GETBLOCK_API_KEY
const RPC_URL = `https://bsc.getblock.io/mainnet/?api_key=${GETBLOCK_API_KEY}`

export const getPositionId = async (address: string, blockNumber: string, transactionHash: string): Promise<any> => {
  const workEvent = await getWorkEvent(address, blockNumber, transactionHash)
  return workEvent.uid
}

// 0x98172b
export const getPositionIdFromGetBlock = async (address: string, blockNumber: string, block = 'latest', chain: Chain = 'bsc'): Promise<any> => {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
  const result = await provider.getLogs({
    address,
    fromBlock: blockNumber,
    toBlock: blockNumber,
    topics: [
      '0x73c4ef442856bea52a6b34a83f35484ee65828010254ec27766c5a8c13db6c84',
    ]
  });

  const iface = new Interface([{
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "loan",
        "type": "uint256"
      }
    ],
    "name": "Work",
    "type": "event"
  }]);

  const decodedEventLog = iface.decodeEventLog("Work", result[0].data, result[0].topics);
  return parseInt(decodedEventLog.id)
}
