import { getSymbolFromAddress, getSymbolsFromTransfers, getSymbolSlugsFromTransfers } from '..'
import { DirectionType, ITransfer, ITransferInfo } from '../../type'
import { stringToFloat } from '../../utils/converter'

export const getTokenInfoFromTransferToAddressMap = (transferInfos: ITransfer[]) => {
  return Object.assign(
    {},
    ...Object.keys(transferInfos).map((k) => {
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

export const getTokenInfoFromTransferAddressMap = (transferInfos: ITransfer[]) => {
  return Object.assign(
    {},
    ...Object.keys(transferInfos).map((k) => {
      const transferInfo = transferInfos[k]
      return {
        [transferInfo.address.toLowerCase()]: {
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
    return {
      ...transfer,
      tokenSymbol,
      tokenPriceUSD,
      tokenAmount,
      tokenValueUSD
    } as unknown as ITransferInfo
  })
}

export const withRecordedPriceUSD = (transfers: ITransfer[], symbolSlugYMDPriceUSDMap: { [symbolSlugYMD: string]: number }): ITransferInfo[] => {
  // Get symbols
  const { symbols, symbolSlugYMDs } = getSymbolSlugsFromTransfers(transfers)

  // Attach usd price and return
  return transfers.map((transfer, i) => {
    const tokenAmount = stringToFloat(transfer.value)
    const tokenSymbol = symbols[i]

    if (!tokenSymbol)
      return {
        ...transfer,
        tokenSymbol,
        tokenPriceUSD: 0,
        tokenAmount,
        tokenValueUSD: 0
      } as unknown as ITransferInfo

    const tokenSymbolSlug = symbolSlugYMDs[i]
    const priceUSD = symbolSlugYMDPriceUSDMap[tokenSymbolSlug] || 0
    const ib_priceUSD = tokenSymbolSlug && tokenSymbol.startsWith('ib') ? symbolSlugYMDPriceUSDMap[tokenSymbolSlug.replace('BSC:ib', 'BSC:')] : 0
    const tokenPriceUSD = isNaN(priceUSD) ? 0 : priceUSD || ib_priceUSD || 0

    if (tokenAmount > 0 && tokenPriceUSD === 0) {
      throw new Error(`${tokenSymbol} price is 0`)
    }

    const tokenValueUSD = tokenPriceUSD * tokenAmount
    return {
      ...transfer,
      tokenSymbol,
      tokenPriceUSD,
      tokenAmount,
      tokenValueUSD
    } as unknown as ITransferInfo
  })
}

export const withDirection = (account: string, transfers: ITransfer[]) => {
  return transfers.map((transfer) => {
    return {
      ...transfer,
      direction: account.toLowerCase() === transfer.from_address.toLowerCase() ? DirectionType.OUT : DirectionType.IN
    }
  })
}
