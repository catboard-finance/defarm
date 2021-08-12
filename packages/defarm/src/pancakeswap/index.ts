import BigNumber from "bignumber.js";
import { poolsConfig } from "./config/constants";
import { fetchPoolsBlockLimits, fetchPoolsTotalStaking } from "./pools/fetchPools";
import { getTokenPricesFromFarm } from "./pools/helpers";
import { getFarmApr, getPoolApr } from "./utils/apr";
import { getBalanceNumber } from "./utils/formatBalance";
import { farmsConfig, farmsAddressMap, farmsSymbolMap } from './config/constants/farms'
import isArchivedPid from './utils/farmHelpers'
import priceHelperLpsConfig from './config/constants/priceHelperLps'
import fetchFarms from "./farms/fetchFarms";
import fetchFarmsPrices from "./farms/fetchFarmsPrices";
import { Farm } from "./types";
import { getAddress } from "./utils/addressHelpers";
import web3NoAccount from "./utils/web3";
import { calculateLiquidityMinted } from "./swap/mint";
import { ChainId, Token, Pair } from '@pancakeswap/sdk'
import { FarmConfig, PoolConfig } from "./config/constants/types";

export const fetchTokenUSDPricesBySymbols = async (symbols: string[]) => {
    const busdFarms = await fetchFarmsWithAPRBySymbolsAndQuote(symbols, 'BUSD')
    const prices = busdFarms.map(farm => {
        // BNB-BUSD not exists, only BUSD-BNB will need to use `quoteToken` for BNB price
        if (farm.lpSymbol === 'BUSD-BNB LP') {
            return farm.quoteToken.busdPrice
        }

        return farm.token.busdPrice
    })

    return prices
}

export const fetchFarmsWithAPRBySymbolsAndQuote = async (symbols: string[], quoteSymbol: string) => {
    const farmConfigs = symbols.map(symbol => {
        // BNB-BUSD not exists, only BUSD-BNB
        if (symbol === 'BNB' && quoteSymbol === 'BUSD') {
            return farmsSymbolMap[`${quoteSymbol}-${symbol} LP`].pid
        }

        return farmsSymbolMap[`${symbol}-${quoteSymbol} LP`].pid
    })

    const farms = await fetchFarmsWithAPR(farmConfigs)
    return farms
}

export const fetchFarmsWithAPRByAddresses = async (addresses: string[]) => {
    const pids: number[] = addresses.map(address => farmsAddressMap[address].pid)
    return fetchFarmsWithAPR(pids)
}

export const getPairByAddress = (baseAddress: string, quoteAddress: string) => {
    const tokenA = new Token(ChainId.MAINNET, baseAddress, 18)
    const tokenB = new Token(ChainId.MAINNET, quoteAddress, 18)
    const lpAddress = Pair.getAddress(tokenA, tokenB)

    return lpAddress
}

export const fetchFarmsWithAPRBySymbols = async (lpSymbols: string[]) => {
    const pids: number[] = lpSymbols.map(lpSymbol => farmsSymbolMap[lpSymbol].pid)
    return fetchFarmsWithAPR(pids)
}

export const fetchFarmsWithAPR = async (pids: number[]) => {
    // All farm?
    let _pids = pids ? pids : farmsConfig.map(farm => farm.pid)

    const farmToFetchList = Array.from(new Set([0, 251, 252, ..._pids]))
    const all_lp: any[] = await fetchFarmsPublicDataAsync(farmsConfig, farmToFetchList)
    const cakePrice = new BigNumber(all_lp[1].token.busdPrice)

    const result = all_lp.map((farm: Farm) => {
        if (!farm.lpTotalInQuoteToken) throw new Error('Required lpTotalInQuoteToken.')
        if (!farm.quoteToken.busdPrice) throw new Error('Required quoteToken.busdPrice.')
        if (!farm.poolWeight) throw new Error('Required poolWeight.')
        if (!farm.tokenPriceVsQuote) throw new Error('Required tokenPriceVsQuote.')

        const totalLiquidity = new BigNumber(farm.lpTotalInQuoteToken).times(farm.quoteToken.busdPrice)
        farm.apr = farm.pid !== 0 ? getFarmApr(new BigNumber(farm.poolWeight), cakePrice, totalLiquidity).toString() : null
        farm.mintRate = farm.pid !== 0 ? calculateLiquidityMinted(ChainId.MAINNET, farm, "1", farm.tokenPriceVsQuote)?.toSignificant() : null
        return farm
    })

    // Remove ref
    const farmsResult = pids ? result.filter((farm: Farm) => pids.includes(farm.pid as never)) : result

    return farmsResult
}

export const fetchPoolsPublicDataByAddresses = async (poolAddresses: string[]) => {
    const selectedPools = poolAddresses ? poolsConfig.filter(pool => poolAddresses.includes(pool.contractAddress[56])) : poolsConfig
    const pools = await fetchPoolsPublicData(selectedPools)

    const poolsWithConfig = pools.map((pool, index) => ({
        pool,
        config: selectedPools[index]
    }))

    return poolsWithConfig
}

export const fetchPoolsPublicData = async (selectedPools: PoolConfig[]) => {
    const blockNumber = await web3NoAccount.eth.getBlockNumber()
    const farmData = await pollFarmsData()
    const result = await fetchPoolsPublicDataAsync(blockNumber)(farmData, selectedPools)

    return result
}

export const nonArchivedFarms = farmsConfig.filter(({ pid }) => !isArchivedPid(pid))

export const pollFarmsData = async (includeArchive = false) => {
    const farmsToFetch = includeArchive ? farmsConfig : nonArchivedFarms
    const pids = farmsToFetch.map((farmToFetch) => farmToFetch.pid)

    return fetchFarmsPublicDataAsync(farmsConfig, pids)
}

export const fetchPoolsPublicDataAsync = (currentBlock: number) => async (farmData: any, selectedPools: PoolConfig[]) => {
    const blockLimits = await fetchPoolsBlockLimits()
    const totalStakings = await fetchPoolsTotalStaking()

    const prices: any = getTokenPricesFromFarm(farmData)

    const liveData = selectedPools.map((pool) => {
        const blockLimit = blockLimits.find((entry) => entry.sousId === pool.sousId)
        const totalStaking = totalStakings.find((entry) => entry.sousId === pool.sousId)
        const isPoolEndBlockExceeded = currentBlock > 0 && blockLimit ? currentBlock > Number(blockLimit.endBlock) : false
        const isPoolFinished = pool.isFinished || isPoolEndBlockExceeded

        const stakingTokenAddress = pool.stakingToken.address ? getAddress(pool.stakingToken.address).toLowerCase() : null
        const stakingTokenPrice = stakingTokenAddress ? prices[stakingTokenAddress] : 0

        const earningTokenAddress = pool.earningToken.address ? getAddress(pool.earningToken.address).toLowerCase() : null
        const earningTokenPrice = earningTokenAddress ? prices[earningTokenAddress] : 0
        const apr = !isPoolFinished
            ? getPoolApr(
                stakingTokenPrice,
                earningTokenPrice,
                getBalanceNumber(new BigNumber(totalStaking ? totalStaking.totalStaked : 0), pool.stakingToken.decimals),
                parseFloat(pool.tokenPerBlock),
            )
            : 0

        return {
            stakingToken: pool.stakingToken.symbol,
            earningToken: pool.earningToken.symbol,
            ...blockLimit,
            ...totalStaking,
            stakingTokenPrice,
            earningTokenPrice,
            apr,
            isFinished: isPoolFinished,
        }
    })

    return liveData.filter(e => e.apr)
}

export const fetchFarmsPublicDataAsync = async (farmsConfig: FarmConfig[], pids: number[]) => {
    const farmsToFetch = farmsConfig.filter((farmConfig: FarmConfig) => pids.includes(farmConfig.pid))

    // Add price helper farms
    const farmsWithPriceHelpers = farmsToFetch.concat(priceHelperLpsConfig)

    const farms = await fetchFarms(farmsWithPriceHelpers)
    const farmsWithPrices = await fetchFarmsPrices(farms)

    // Filter out price helper LP config farms
    const farmsWithoutHelperLps = farmsWithPrices.filter((farm: Farm) => {
        return farm.pid || farm.pid === 0
    })

    return farmsWithoutHelperLps
}
