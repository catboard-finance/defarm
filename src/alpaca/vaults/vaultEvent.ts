import { BigNumber } from "ethers"
import { getEventsByBlockNumber } from "../../account"

export interface IWorkEvent {
  uid: string // id
  loan: BigNumber
}

export const getWorkEvent = async (address: string, blockNumber: number, transactionHash: string): Promise<IWorkEvent> => {
  const abi = `{
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
}`

  const topic = 'Work(uint256,uint256)'
  const events = await getEventsByBlockNumber(address, abi, topic, blockNumber)
  const matchedEvent = events.find(e => e.transaction_hash === transactionHash)
  return {
    uid: matchedEvent ? matchedEvent.data.uid : null,
    loan: matchedEvent ? BigNumber.from(matchedEvent.data.loan) : null
  }
}
