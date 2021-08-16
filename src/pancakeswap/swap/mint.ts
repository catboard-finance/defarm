import { ChainId, TokenAmount, Pair, Token, JSBI, CurrencyAmount, Currency } from '@pancakeswap/sdk'
import { parseUnits } from '@ethersproject/units'
import { BigNumber } from 'ethers'
import { Farm } from '../types'
import { wrappedCurrencyAmount } from './wrappedCurrency'
import tokens from '../config/constants/tokens'

export function expandTo18Decimals(n: number): BigNumber {
  return BigNumber.from(n).mul(BigNumber.from(10).pow(18))
}

// try to parse a user entered amount for a given token
export function tryParseAmount(value?: string, currency?: Currency): CurrencyAmount | undefined {
  if (!value || !currency) {
    return undefined
  }
  try {
    const typedValueParsed = parseUnits(value, currency.decimals).toString()
    if (typedValueParsed !== '0') {
      return currency instanceof Token
        ? new TokenAmount(currency, JSBI.BigInt(typedValueParsed))
        : CurrencyAmount.ether(JSBI.BigInt(typedValueParsed))
    }
  } catch (error) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.info(`Failed to parse input amount: "${value} as ${currency.symbol}"`, error)
  }
  // necessary for all paths to return a value
  return undefined
}

export const calculateLiquidityMinted = (chainId: ChainId, farm: Farm, a: string, b: string) => {
  const ta = tokens[farm.token.symbol.toLowerCase()]
  const tb = tokens[farm.quoteToken.symbol.toLowerCase()]
  const TokenA = new Token(chainId, ta.address[chainId], ta.decimals, ta.symbol)
  const TokenB = new Token(chainId, tb.address[chainId], tb.decimals, tb.symbol)

  const pair = new Pair(
    new TokenAmount(TokenA, parseUnits(farm.tokenAmountTotal, TokenA.decimals).toString()),
    new TokenAmount(TokenB, parseUnits(farm.quoteTokenAmountTotal, TokenB.decimals).toString())
  )

  const currencyAAmount = tryParseAmount(a.toString().slice(0, 7), TokenA)
  const currencyBAmount = tryParseAmount(b.toString().slice(0, 7), TokenB)

  const [tokenAmountA, tokenAmountB] = [
    wrappedCurrencyAmount(currencyAAmount, chainId),
    wrappedCurrencyAmount(currencyBAmount, chainId),
  ]

  if (pair && tokenAmountA && tokenAmountB) {
    const farmToken = new Token(chainId, farm.lpAddresses[chainId], farm.token.decimals)
    const totalSupplyAmount = new TokenAmount(farmToken, farm.lpTotalSupply)
    const liquidityMinted = pair.getLiquidityMinted(totalSupplyAmount, tokenAmountA, tokenAmountB)
    return liquidityMinted
  }

  return undefined
}
