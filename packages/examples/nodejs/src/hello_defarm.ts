import { alpaca, pancakeswap } from '@undefiorg/defarm'

export const fetchALPACA = async () => {
  const results = await alpaca.fetchTokenUSDPricesBySymbols(['ibALPACA'])
  console.log(results)
  return results
}

export const fetchCAKEBNB = async () => {
  const results = await pancakeswap.fetchFarmsWithAPRBySymbols(['CAKE-BNB LP'])
  console.log(results)
  return results
}

export const fetchCAKE = async () => {
  const results = await pancakeswap.fetchTokenUSDPricesBySymbols(['CAKE'])
  console.log(results)
  return results
}
