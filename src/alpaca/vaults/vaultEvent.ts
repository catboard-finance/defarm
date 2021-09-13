import { BigNumber } from "ethers"
import { getEventsByBlockNumber } from "../../account"
import abi from '../../alpaca/users/userKill.abi.json'

export interface IWorkEvent {
  uid: string // id
  loan: BigNumber
}

export const getWorkEvent = async (address: string, blockNumber: string, transactionHash: string): Promise<IWorkEvent> => {
  const abiString = JSON.stringify(abi.Kill)
  const topic = 'Work(uint256,uint256)'
  const events = await getEventsByBlockNumber(address, abiString, topic, blockNumber)
  const matchedEvent = events.find(e => e.transaction_hash === transactionHash)
  return {
    uid: matchedEvent ? matchedEvent.data.uid : null,
    loan: matchedEvent ? BigNumber.from(matchedEvent.data.loan) : null
  }
}
