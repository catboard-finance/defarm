import random from 'lodash/random'

// Array of available nodes to connect to
export const nodes = [
  // # 10+ nodes balanced, US/EU
  process.env.REACT_APP_NODE_1 || "https://bsc-dataseed1.ninicoin.io",
  // # 10+ nodes balanced, US/EU
  process.env.REACT_APP_NODE_2 || "https://bsc-dataseed1.defibit.io",
  // # 10+ nodes balanced in each region, global
  process.env.REACT_APP_NODE_3 || "https://bsc-dataseed.binance.org",
]
const getNodeUrl = () => {
  const randomIndex = random(0, nodes.length - 1)
  return nodes[randomIndex]
}

export default getNodeUrl
