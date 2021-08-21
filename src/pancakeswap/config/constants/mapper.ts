import { farmsConfig, tokensConfig } from './index'
import { FarmConfig, Token } from './types'

interface FarmSymbolMap {
  [lpSymbol: string]: FarmConfig;
}

const _farmsSymbolMap = {}
farmsConfig.forEach(farmConfig => {
  _farmsSymbolMap[farmConfig.lpSymbol] = _farmsSymbolMap[farmConfig.lpSymbol] || farmConfig
})

export const farmsSymbolMap: FarmSymbolMap = _farmsSymbolMap

interface FarmAddressMap {
  [address: string]: FarmConfig;
}

const _farmsAddressMap = {}
farmsConfig.forEach(farmConfig => {
  _farmsAddressMap[farmConfig.lpAddresses[56]] = _farmsAddressMap[farmConfig.lpAddresses[56]] || farmConfig
})

export const farmsAddressMap: FarmAddressMap = _farmsAddressMap


interface TokenAddressMap {
  [address: string]: Token;
}

const _tokensAddressMap = {}
for (const [_, value] of Object.entries(tokensConfig)) {
  if (!value["address"]) continue
  _tokensAddressMap[value["address"][56]] = _tokensAddressMap[value["address"][56]] || value
}

export const tokensAddressMap: TokenAddressMap = _tokensAddressMap
