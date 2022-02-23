interface ISolanaSymbolInfo {
  symbol: string
  name: string
}

const SOLANA_SYMBOL_MAP = {
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': {
    name: 'Raydium (RAY)',
    symbol: 'RAY'
  }
}

export const getSolanaSymbolInfoByMintAddress = (mintAddress: string): ISolanaSymbolInfo =>
  SOLANA_SYMBOL_MAP[mintAddress] || {
    name: 'Unknown',
    symbol: null
  }
