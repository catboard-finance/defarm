require('dotenv').config()

import { Chain } from "@defillama/sdk/build/general";
import vaultABI from './Vault.abi.json'
import { ethers } from "ethers";
// import { Interface } from "ethers/lib/utils";

const GETBLOCK_API_KEY = process.env.GETBLOCK_API_KEY
const RPC_URL = `https://bsc.getblock.io/mainnet/?api_key=${GETBLOCK_API_KEY}`
const VAULT_ADDRESS = '0x158da805682bdc8ee32d52833ad41e74bb951e59'
// const WORKER_TOPIC = '0x73c4ef442856bea52a6b34a83f35484ee65828010254ec27766c5a8c13db6c84'

export const eventFilterv5WithPagination = async (contractAddress, erc20abi, provider, numberOfResponses) => {
  // creating the interface of the ABI
  const iface = new ethers.utils.Interface(erc20abi);

  // intialize array for the logs
  let logs = [];
  // get latest block number
  const latest = await provider.getBlockNumber();
  // intialize a counter for which block we're scraping starting at the most recent block
  let blockNumberIndex = latest;

  // while loop runs until there are as many responses as desired
  while (logs.length < numberOfResponses) {
    const tempLogs = await provider.getLogs({
      address: contractAddress,
      // both fromBlock and toBlock are the index, meaning only one block's logs are pulled
      fromBlock: blockNumberIndex,
      toBlock: blockNumberIndex,
    })
    // an added console.log to help see what's going on
    console.log("BLOCK: ", blockNumberIndex, " NUMBER OF LOGS: ", tempLogs.length);
    blockNumberIndex -= 1;
    logs = logs && logs.length > 0 ? [...logs, ...tempLogs] : [...tempLogs]
  };

  // this will return an array with the decoded events
  const decodedEvents = logs.map(log => {
    iface.decodeEventLog("Transfer", log.data)
  });

  // let's pull out the to and from addresses and amounts
  const toAddresses = decodedEvents.map(event => event["values"]["to"]);
  const fromAddresses = decodedEvents.map(event => event["values"]["from"]);
  const amounts = decodedEvents.map(event => event["values"]["amount"]);

  return [fromAddresses, toAddresses, amounts]
}

export const getPositionIds = async (account: string, block = 'latest', chain: Chain = 'bsc'): Promise<any> => {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL)

  const lol = await eventFilterv5WithPagination(VAULT_ADDRESS, vaultABI, provider, 10)
  console.log('list:', lol)

  return lol

  // const lol = await provider.getLogs({
  //   address: account,
  //   topics: [
  //     id("Transfer(address,address,uint256)"),
  //     // hexZeroPad(account, 32)
  //   ]
  // })

  // console.log('list:', lol)

  // 1. Get all transactions from account address.
  // TODO
  // const abi = [
  //   "event Transfer(address indexed src, address indexed dst, uint val)"
  // ];

  // const contract = new Contract(account, abi, provider);
  // const lol = contract.filters.Transfer()
  // console.log('list:', lol)

  // contract.queryFilter(
  // contract.filters.Transfer(account, '0x158da805682bdc8ee32d52833ad41e74bb951e59')

  // 2. Get `txHash`, `blockNumber` that interact with `VAULT_ADDRESS`.
  // const blockNumber = '0x98172b'

  // 3. Get log from `txHash`, `blockNumber`.
  // const result = await provider.getLogs({
  //   address: VAULT_ADDRESS,
  //   fromBlock: 0,
  //   toBlock: 'latest',
  //   topics: [
  //     WORKER_TOPIC,
  //   ]
  // });

  // // 4. Get `positionId` from 
  // const iface = new Interface(vaultABI);
  // const result2 = iface.decodeEventLog("Work", result[0].data, result[0].topics);
  // console.log('position id:', parseInt(result2.id))

  // return [parseInt(result2.id)]
}