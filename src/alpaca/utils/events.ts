require('dotenv').config()

import { Chain } from "@defillama/sdk/build/general";
import { BigNumber, ethers, utils } from "ethers";
import { Interface } from "ethers/lib/utils";
import { getWorkEvent } from "../vaults/vaultEvent";

const GETBLOCK_API_KEY = process.env.GETBLOCK_API_KEY
const RPC_URL = `https://bsc.getblock.io/mainnet/?api_key=${GETBLOCK_API_KEY}`

export const getPositionRecordFromWorkEvent = async (address: string, blockNumber: string, transactionHash: string): Promise<{ id: number, loan: BigNumber }> => {
  const workEvent = await getWorkEvent(address, blockNumber, transactionHash)
  return {
    id: parseInt(workEvent.uid),
    loan: workEvent.loan,
  }
}

export const getPositionIdFromGetBlock = async (address: string, blockNumber: string, chain: Chain = 'bsc'): Promise<{ id: number, loan: BigNumber }> => {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
  const topic = 'Work(uint256,uint256)'
  const result = await provider.getLogs({
    address,
    fromBlock: parseInt(blockNumber),
    toBlock: parseInt(blockNumber),
    topics: [
      utils.id(topic),
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
  return {
    id: parseInt(decodedEventLog.id),
    loan: BigNumber.from(decodedEventLog.loan),
  }
}
