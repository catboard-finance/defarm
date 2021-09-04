import { getSymbolFromAddress } from ".."
import { ITransfer } from "../../type"

export const getTokenInfoFromTransferAddressMap = (transferInfos: ITransfer[]) => {
  return Object.assign({},
    ...Object.keys(transferInfos).map(k => {
      const transferInfo = transferInfos[k]
      return {
        [transferInfo.to_address.toLowerCase()]: {
          symbol: getSymbolFromAddress(transferInfo.address),
          address: transferInfo.address
        }
      }
    })
  )
}
