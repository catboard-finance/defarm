import { ChainId } from '@undefiorg/pancake-swap-sdk'
// import store from 'state'
import { GAS_PRICE_GWEI } from './helpers'

/**
 * Function to return gasPrice outwith a react component
 */
const getGasPrice = (): string => {
  const chainId = process.env.REACT_APP_CHAIN_ID
  return chainId === ChainId.MAINNET.toString() ? GAS_PRICE_GWEI.default : GAS_PRICE_GWEI.testnet

  // const state = store.getState()
  // const userGas = state.user.gasPrice || GAS_PRICE_GWEI.default
  // return chainId === ChainId.MAINNET.toString() ? userGas : GAS_PRICE_GWEI.testnet
}

export default getGasPrice
