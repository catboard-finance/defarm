require('dotenv').config()

import { BigNumber } from "ethers";
import { getWorkEvent } from "../vaults/vaultEvent";

export const getPositionIdFromMoralis = async (address: string, blockNumber: string, transactionHash: string): Promise<{ id: number, loan: BigNumber }> => {
  const workEvent = await getWorkEvent(address, blockNumber, transactionHash)
  return {
    id: parseInt(workEvent.uid),
    loan: BigNumber.from(workEvent.loan),
  }
}
