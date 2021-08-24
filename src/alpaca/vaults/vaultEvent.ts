import { BigNumber } from "ethers"
import { getEventsByBlockNumber } from "../../account"

export interface IWorkEvent {
  uid: string // id
  loan: BigNumber
}

export const getWorkEvent = async (address: string, blockNumber: number): Promise<IWorkEvent> => {
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
  return {
    uid: events[0].data.uid,
    loan: BigNumber.from(events[0].data.loan)
  }
}
