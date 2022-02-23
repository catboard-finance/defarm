interface ISolanaToken {
  symbol: string
  name: string
  address: string
  decimals: string
}

export const getSolanaSymbolInfoByAddress = (address: string): ISolanaToken => {
  const whitelist = require('./whitelist')
  const token = whitelist.find((e) => e.address === address)
  return token
}
