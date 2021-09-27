require('dotenv').config()

import { Chain } from "@defillama/sdk/build/general";
import { BigNumber, ethers, utils } from "ethers";
import { Interface } from "ethers/lib/utils";
import abi from '../alpaca/users/userWork.abi.json'

const GETBLOCK_API_KEY = process.env.GETBLOCK_API_KEY
const RPC_URL = `https://bsc.getblock.io/mainnet/?api_key=${GETBLOCK_API_KEY}`

export const getPositionIdFromGetBlock = async (address: string, blockNumber: string, transactionHash: string, chain: Chain = 'bsc'): Promise<{ id: number, loan: BigNumber }> => {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
  const topic = 'Work(uint256,uint256)'
  const events = await provider.getLogs({
    address,
    fromBlock: parseInt(blockNumber),
    toBlock: parseInt(blockNumber),
    topics: [
      utils.id(topic),
    ]
  });

  const iface = new Interface([abi.Work]);

  const matchedEvent = events.find(e => e.transactionHash === transactionHash)
  const decodedEventLog = iface.decodeEventLog("Work", matchedEvent.data, matchedEvent.topics);

  return {
    id: parseInt(decodedEventLog.id),
    loan: BigNumber.from(decodedEventLog.loan),
  }
}

export const getKilledPositionFromGetBlock = async (address: string, blockNumber: string, transactionHash: string, chain: Chain = 'bsc'): Promise<{ id: number, posVal: BigNumber }> => {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
  const topic = 'Kill(uint256,address,address,uint256,uint256,uint256,uint256)'
  const events = await provider.getLogs({
    address,
    fromBlock: parseInt(blockNumber),
    toBlock: parseInt(blockNumber),
    topics: [
      utils.id(topic),
    ]
  });

  const iface = new Interface([abi.Work]);

  const matchedEvent = events.find(e => e.transactionHash === transactionHash)
  const decodedEventLog = iface.decodeEventLog("Kill", matchedEvent.data, matchedEvent.topics);
  // uint256 indexed id,
  // address indexed killer,
  // address owner,
  // uint256 posVal,
  // uint256 debt,
  // uint256 prize,
  // uint256 left
  return {
    id: parseInt(decodedEventLog.id),
    posVal: BigNumber.from(decodedEventLog.posVal),
  }
}
