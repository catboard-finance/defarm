import BigNumber from "bignumber.js";
import { farmsConfig, poolsConfig, tokensConfig } from "./config/constants";
import { fetchPoolsBlockLimits, fetchPoolsTotalStaking } from "./pools/fetchPools";
import { getTokenPricesFromFarm } from "./pools/helpers";
import { getFarmApr, getPoolApr } from "./utils/apr";
import { getBalanceNumber } from "./utils/formatBalance";
import farms, { farmsAddressMap, farmsSymbolMap } from './config/constants/farms'
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

export const config = {
    farms: farmsConfig,
    pools: poolsConfig,
    tokens: tokensConfig,
}

export const getSupportedUSDSymbols = () => {
    return ['ETH',
        ...farms
            .filter(farm => farm.quoteToken.symbol === 'BUSD')
            .map(farm => farm.token.symbol)
    ];
}

export const fetchTokenUSDPricesBySymbols = async (symbols: string[]) => {
    // [0, 251, 252, 283] = ['CAKE', 'CAKE-BNB LP', 'BUSD-BNB LP', 'USDC-BUSD LP']
    // 252 = BNB-BUSD not exists, only BUSD-BNB
    // 400 = ETH-USDC LP

    // Uppercase
    symbols = symbols.map(symbol => symbol.toUpperCase());

    const quoteSymbol = 'BUSD'
    const pairs = symbols.map(symbol => {
        if (symbol === 'BNB') {
            return `${quoteSymbol}-${symbol} LP`
        } else if (symbol === 'ETH') {
            return `ETH-USDC LP`
        }

        return `${symbol}-${quoteSymbol} LP`
    })

    // ETH-USDC LP required USDC-BUSD LP' for calculate busdPrice
    if (pairs.includes('ETH-USDC LP')) {
        pairs.unshift('USDC-BUSD LP')
    }

    const farms = await fetchFarmsWithAPRBySymbols(pairs)

    // Remove `USDC-BUSD LP`
    if (pairs.includes('ETH-USDC LP')) {
        pairs.shift()
    }

    const prices = symbols.map((symbol, i) => {
        const pair = pairs[i]
        const farm = farms.find(farm => farm.lpSymbol === pair)

        if (!farm) {
            return {
                symbol,
                address: null,
                busdPrice: null,
            }
        }

        if (symbol === 'BNB') {
            return {
                symbol,
                address: farm.quoteToken.address[56],
                busdPrice: farm.quoteToken.busdPrice,
            }
        }

        return {
            symbol,
            address: farm.token.address[56],
            busdPrice: farm.token.busdPrice,
        }
    })

    return prices
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
    const pids: number[] = lpSymbols.map(lpSymbol => farmsSymbolMap[lpSymbol]?.pid).filter(pid => pid)
    return fetchFarmsWithAPR(pids)
}

export const fetchFarmsWithAPR = async (pids: number[]) => {
    // All farm?
    let _pids = pids ? pids : farmsConfig.map(farm => farm.pid)

    const farmToFetchList = Array.from(new Set([0, 251, 252, 283, ..._pids]))
    const all_lp: any[] = await fetchFarmsPublicDataAsync(farmsConfig, farmToFetchList)
    const cakePrice = new BigNumber(all_lp[1].token.busdPrice)

    const result = all_lp.map((farm: Farm) => {
        if (!farm.lpTotalInQuoteToken || !farm.quoteToken.busdPrice || farm.pid === 0) {
            return farm
        }

        const totalLiquidity = new BigNumber(farm.lpTotalInQuoteToken).times(farm.quoteToken.busdPrice)
        farm.apr = getFarmApr(new BigNumber(farm.poolWeight), cakePrice, totalLiquidity)?.toString()
        farm.mintRate = calculateLiquidityMinted(ChainId.MAINNET, farm, "1", farm.tokenPriceVsQuote)?.toSignificant()
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
