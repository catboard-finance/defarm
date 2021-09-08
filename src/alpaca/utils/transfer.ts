import { getSymbolFromAddress, getSymbolsFromTransfers } from ".."
import { DirectionType, ITransfer, ITransferInfo } from "../../type"
import { stringToFloat } from "./converter"

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

export const withPriceUSD = (transfers: ITransfer[], symbolPriceUSDMap: { [symbol: string]: string }): ITransferInfo[] => {
  // Get symbols
  const symbols = getSymbolsFromTransfers(transfers)

  // Attach usd price and return
  return transfers.map((transfer, i) => {
    const tokenSymbol = symbols[i]
    const tokenPriceUSD = parseFloat(symbolPriceUSDMap[tokenSymbol])
    const tokenAmount = stringToFloat(transfer.value)
    const tokenValueUSD = tokenPriceUSD * tokenAmount
    return ({
      ...transfer,
      tokenSymbol,
      tokenPriceUSD,
      tokenAmount,
      tokenValueUSD,
    }) as unknown as ITransferInfo
  })
}

export const withDirection = (account: string, transfers: ITransfer[]) => {
  return transfers.map(transfer => {
    return ({
      ...transfer,
      direction: account === transfer.from_address.toLowerCase() ? DirectionType.OUT : DirectionType.IN
    })
  })
}
