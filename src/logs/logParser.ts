import { Chain } from "@defillama/sdk/build/general";
import vaultABI from './Vault.abi.json'
import { ethers } from "ethers";
import { Interface } from "ethers/lib/utils";

export const eventFilter = async (contractAddress, contractAbi, eventName, _provider) => {
  const provider = _provider
  // this will return an array with an object for each event
  const events = contractAbi.filter(obj => obj.type ? obj.type === "event" : false);
  // getting the Transfer event and pulling it out of its array
  const event = events.filter(event => event.name === eventName)[0];
  // getting the types for the event signature
  const types = event.inputs.map(input => input.type)
  // knowing which types are indexed will be useful later
  let indexedInputs = [];
  let unindexedInputs = [];
  event.inputs.forEach(input => {
    input.indexed ?
      indexedInputs.push(input) :
      unindexedInputs.push(input)
  });
  // event signature
  const eventSig = `${event.name}(${types.toString()})`;
  // getting the topic
  const eventTopic = ethers.utils.id(eventSig);

  // you could also filter by blocks using fromBlock and toBlock
  const logs = await provider.getLogs({
    address: contractAddress,
    topics: [eventTopic]
  });

  // need to decode the topics and events
  const decoder = new ethers.utils.AbiCoder();
  const decodedLogs = logs.map(log => {
    // remember how we separated indexed and unindexed events?
    // it was because we need to sort them differently here
    const decodedTopics = indexedInputs.map(input => {
      // we use the position of the type in the array as an index for the
      // topic, we need to add 1 since the first topic is the event signature
      const value = decoder.decode(input.type, log.topics[indexedInputs.indexOf(input) + 1]);
      return `${input.name}: ${value}`;
    })
    const decodedDataRaw = decoder.decode(unindexedInputs, log.data);
    const decodedData = unindexedInputs.map((input, i) => {
      return `${input.name}: ${decodedDataRaw[i]}`
    });

    return [...decodedTopics, ...decodedData]
  });

  return decodedLogs
}

export const readBlockForLog = async (txHash: string, block = 'latest', chain: Chain = 'bsc'): Promise<any> => {
  const RPC_URL = "https://bsc-dataseed.binance.org"
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
  const eventName = 'Work'
  const contractAbi = vaultABI

  console.log('lol')
  const result1 = await eventFilter(txHash, contractAbi, eventName, provider)
  console.log('result1:', result1)

  // const data = "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000";
  // const topics = [
  //   "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
  //   "0x0000000000000000000000008ba1f109551bd432803012645ac136ddd64dba72",
  //   "0x000000000000000000000000ab7c8803962c0f2f5bbbe3fa8bf41cd82aa1923c"
  // ];

  const data = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const topics = [
    "0x73c4ef442856bea52a6b34a83f35484ee65828010254ec27766c5a8c13db6c84",
    "0x0000000000000000000000000000000000000000000000000000000000004784",
  ]

  const iface = new Interface(vaultABI);

  const result = iface.decodeEventLog("Work", data, topics);

  console.log('result2:', result)

  return result
}