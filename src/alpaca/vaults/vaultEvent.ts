import { BigNumber } from 'ethers'
import { getEventsByBlockNumber } from '../../lib/moralis'
import abi from '../../alpaca/users/userWork.abi.json'

export interface IWorkEvent {
  uid: string // id
  loan: BigNumber
}

export const getWorkEvent = async (address: string, blockNumber: string, transactionHash: string): Promise<IWorkEvent> => {
  const abiString = JSON.stringify(abi.Work)
  const topic = 'Work(uint256,uint256)'
  const events = await getEventsByBlockNumber(address, abiString, topic, blockNumber)
  const matchedEvent = events.find((e) => e.transaction_hash === transactionHash)
  return {
    uid: matchedEvent ? matchedEvent.data.uid : null,
    loan: matchedEvent ? BigNumber.from(matchedEvent.data.loan) : null
  }
}
