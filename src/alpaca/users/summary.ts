import _ from "lodash"
import { ICurrentPosition, withCurrentPosition } from "./position";
import { IFarmInvestmentInfo, ILendInvestmentInfo, IStakeInvestmentInfo, IUserInvestmentInfo, IUserInvestmentTransfer } from "./investment";
import { InvestmentTypeObject } from "../utils/transaction";
import { ICurrentBalanceInfo } from "./current";

const getUniqueSymbolsFromUserInvestmentTransfer = (transfers: IUserInvestmentTransfer[]) => {
  return [...new Set(transfers.map(transfer => transfer.tokenSymbol))]
}

export interface ITokenActivity {
  tokenSymbol: string,
  tokenAmount: number,
  tokenPriceUSD: number,
  tokenValueUSD: number,
}

export interface IPositionSummary {
  positionId: number,
  farmName: string,
  vaultAddress: string,

  spends: ITokenActivity[],
  takes: ITokenActivity[],

  positionValueUSD: number,
  debtValueUSD: number,
  equityValueUSD: number,
  totalPartialCloseValueUSD: number,
  totalCloseValueUSD: number,

  stratSymbol: string,
  principalSymbol: string,
}

const getSummaryPerTokenByDirection = (farmInfos: IFarmInvestmentInfo[], direction: 'in' | 'out') => {
  // Sum sent from transfers
  const spendAlls = farmInfos.map(farmInfo => {
    const outTransfers = farmInfo.transfers.filter(transfer => transfer.direction === direction)
    const symbols = getUniqueSymbolsFromUserInvestmentTransfer(outTransfers)
    const symbolInfos = symbols.map(tokenSymbol => {
      // This is no use but just in case we have more than 2 symbols and 2 transfers in same transaction.
      const targets = outTransfers.filter(transfer => transfer.tokenSymbol === tokenSymbol)
      const tokenAmount = _.sumBy(targets, 'tokenAmount')
      const tokenValueUSD = _.sumBy(targets, 'tokenValueUSD')
      const tokenPriceUSD = tokenAmount > 0 ? tokenValueUSD / tokenAmount : tokenValueUSD
      const transferredAt = targets[0].transferredAt

      return {
        tokenSymbol,
        tokenAmount,
        tokenPriceUSD,
        tokenValueUSD,
        transferredAt,
      }
    })

    return symbolInfos
  }).flat()

  // Sum by token symbol
  const movingGroup = _.groupBy(spendAlls, 'tokenSymbol')
  const movingGroups = Object.values(movingGroup)
  const moves = movingGroups.map(e => {
    const tokenSymbol = e[0].tokenSymbol
    const tokenAmount = _.sumBy(e, 'tokenAmount')
    const tokenValueUSD = _.sumBy(e, 'tokenValueUSD')
    const tokenPriceUSD = tokenAmount > 0 ? tokenValueUSD / tokenAmount : tokenValueUSD

    return {
      tokenSymbol,
      tokenAmount,
      tokenPriceUSD,
      tokenValueUSD,
    }
  })

  return moves
}

const withPositionSummaries = (farmHistories: IFarmInvestmentInfo[]): IPositionSummary[] => {
  const recordedFarmGroup = _.groupBy(farmHistories, 'positionId')
  const farms = Object.values(recordedFarmGroup)
  const farmPositions = farms.map((farmInfos: IFarmInvestmentInfo[]) => {

    const spends = getSummaryPerTokenByDirection(farmInfos, 'out')
    const takes = getSummaryPerTokenByDirection(farmInfos, 'in')

    const stratValueUSD = _.sumBy(farmInfos, 'stratValueUSD') || 0
    const principalValueUSD = _.sumBy(farmInfos, 'principalValueUSD') || 0
    const debtValueUSD = _.sumBy(farmInfos, 'borrowValueUSD') || 0
    const equityValueUSD = stratValueUSD + principalValueUSD
    const positionValueUSD = equityValueUSD + debtValueUSD

    // For profit calculation
    const totalPartialCloseValueUSD = _.sumBy(farmInfos, 'totalPartialCloseValueUSD') || 0
    const totalCloseValueUSD = _.sumBy(farmInfos, 'totalCloseValueUSD') || 0
    const totalRewardValueUSD = _.sumBy(farmInfos, 'totalRewardValueUSD') || 0

    // At
    const beginInvestedAt = farmInfos[farmInfos.length - 1].investedAt
    const endInvestedAt = farmInfos[0].investedAt

    return {
      positionId: farmInfos[0].positionId,
      farmName: farmInfos[0].farmName,
      vaultAddress: farmInfos[0].vaultAddress,
      stratSymbol: farmInfos[0].stratSymbol,
      principalSymbol: farmInfos[0].principalSymbol,

      spends,
      takes,
      farmInfos,

      positionValueUSD,
      debtValueUSD,
      equityValueUSD,
      totalPartialCloseValueUSD,
      totalCloseValueUSD,
      totalRewardValueUSD,

      beginInvestedAt,
      endInvestedAt,
    } as IPositionSummary
  })

  return farmPositions
}

const getCurrentRewardsByType = (userCurrentBalances: ICurrentBalanceInfo[], investmentType: InvestmentTypeObject) => {
  const rewardCurrentFarms = userCurrentBalances
    .filter(e => e.investmentType === investmentType)
  const rewardCurrents = [...new Set(Object.values(_.groupBy(rewardCurrentFarms, 'rewardPoolAddress')))]
    .map(e => ({
      rewardPoolName: e[0].rewardPoolName,
      rewardPoolAddress: e[0].rewardPoolAddress,
      rewardSymbol: e[0].rewardSymbol,
      rewardAmount: e[0].rewardAmount,
      rewardValueUSD: e[0].rewardValueUSD,
    }))

  return rewardCurrents
}

const getFarmPNLs = (farmCurrents: ICurrentPosition[], farmSummaries: IPositionSummary[]) => {
  const farmPNLs = farmCurrents.map((farmCurrent, i) => {
    const farmSummary = farmSummaries[i]
    const takenValueUSD = farmSummary.totalCloseValueUSD + farmSummary.totalPartialCloseValueUSD
    const profitValueUSD = farmCurrent.equityValueUSD > 0 ?
      // Farm is still open, should minus withdraw value 
      farmCurrent.equityValueUSD - takenValueUSD :
      // Farm is closed
      takenValueUSD - farmSummary.equityValueUSD

    const farmPastValueUSD = farmSummary.equityValueUSD - takenValueUSD

    // percent = 100*(present - past) / past
    const profitPercent = farmCurrent.equityValueUSD > 0 ?
      100 * (farmCurrent.equityValueUSD - farmPastValueUSD) / farmPastValueUSD : 0

    return {
      positionId: farmCurrent.positionId,
      farmName: farmCurrent.farmName,
      farmStatus: farmCurrent.farmStatus,

      investedValueUSD: farmSummary.equityValueUSD,
      totalPartialCloseValueUSD: farmSummary.totalPartialCloseValueUSD,
      totalCloseValueUSD: farmSummary.totalCloseValueUSD,
      equityValueUSD: farmCurrent.equityValueUSD,
      profitValueUSD,
      profitPercent,
    }
  })

  return farmPNLs
}

export const getInvestmentSummary = async (userInvestmentInfos: IUserInvestmentInfo[], userCurrentBalances: ICurrentBalanceInfo[]) => {

  ///////// HISTORY /////////

  const farmHistories = userInvestmentInfos.filter(e => e.investmentType === InvestmentTypeObject.farm) as IFarmInvestmentInfo[]
  const lendHistories = userInvestmentInfos.filter(e => e.investmentType === InvestmentTypeObject.lend) as ILendInvestmentInfo[]
  const stakeHistories = userInvestmentInfos.filter(e => e.investmentType === InvestmentTypeObject.stake) as IStakeInvestmentInfo[]

  ///////// SUMMARY /////////

  const farmSummaries = withPositionSummaries(farmHistories)

  ///////// CURRENT /////////

  const farmCurrents = await withCurrentPosition(farmSummaries)
  const lendCurrents = userCurrentBalances.filter(e => e.investmentType === InvestmentTypeObject.lend)
  const stakeCurrents = userCurrentBalances.filter(e => e.investmentType === InvestmentTypeObject.stake)

  ///////// PNL /////////

  const farmPNLs = getFarmPNLs(farmCurrents, farmSummaries)

  ///////// REWARD /////////

  // TODO: Gathering from claim history?
  // const earnHistories = userInvestmentInfos.filter(e => e.investmentType === InvestmentTypeObject.farm) as IFarmInvestmentInfo[]
  const rewardCurrentFarms = getCurrentRewardsByType(userCurrentBalances, InvestmentTypeObject.farm)
  const rewardCurrentStakes = getCurrentRewardsByType(userCurrentBalances, InvestmentTypeObject.stake)
  const rewards = [...rewardCurrentFarms, ...rewardCurrentStakes]

  const totalFarmRewardValueUSD = _.sumBy(rewardCurrentFarms, 'rewardValueUSD')
  const totalStakeRewardValueUSD = _.sumBy(rewardCurrentStakes, 'rewardValueUSD')

  const totalRewardValueUSD = _.sumBy(rewards, 'rewardValueUSD')
  const totalRewardAmount = _.sumBy(rewards, 'rewardAmount')

  ///////// ALL /////////

  const res = {
    history: {
      farms: farmHistories,
      lends: lendHistories,
      stakes: stakeHistories,
    },
    summary: {
      farms: farmSummaries,
      // TODO: stakeSummaries,
    },
    current: {
      farms: farmCurrents,
      lends: lendCurrents,
      stakes: stakeCurrents,
    },
    pnl: {
      farms: farmPNLs,

      totalFarmsPNL: _.sumBy(farmPNLs, 'profitValueUSD'),
      totalFarmsEquity: _.sumBy(farmPNLs, 'equityValueUSD'),
      totalFarmsProfitPercent: _.sumBy(farmPNLs, 'profitPercent'),

      totalFarmRewardValueUSD,
      totalStakeRewardValueUSD,

      totalRewardAmount,
      totalRewardValueUSD,
    }
  }

  return res
}
