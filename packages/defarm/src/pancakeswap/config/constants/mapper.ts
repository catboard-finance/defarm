import { farmsConfig } from './index'
import { FarmConfig } from './types'

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
