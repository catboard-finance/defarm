import _ from "lodash"
import { ICurrentPosition, withCurrentPosition } from "./position";
import { IFarmInvestmentInfo, ILendInvestmentInfo, IStakeInvestmentInfo, IUserInvestmentInfo, IUserInvestmentTransfer } from "./investment";
import { InvestmentTypeObject } from "../utils/transaction";
import { ICurrentBalanceInfo } from "./current";

const getUniqueSymbolsFromUserInvestmentTransfer = (transfers: IUserInvestmentTransfer[]) => {
  return [...new Set(transfers.map(transfer => transfer.tokenSymbol))]
}

export interface ISpend {
  tokenSymbol: string,
  tokenAmount: number,
  tokenPriceUSD: number,
  tokenValueUSD: number,
}

export interface IPositionSummary {
  positionId: number,
  farmName: string,
  vaultAddress: string,
  spends: ISpend[],
  positionValueUSD: number,
  debtValueUSD: number,
  equityValueUSD: number,
  stratSymbol: string,
  principalSymbol: string,
}

const withPositionSummaries = (farmHistories: IFarmInvestmentInfo[]): IPositionSummary[] => {
  const recordedFarmGroup = _.groupBy(farmHistories, 'positionId')
  const farms = Object.values(recordedFarmGroup)
  const farmPositions = farms.map((farmInfos: IFarmInvestmentInfo[]) => {

    // Sum sent from transfers
    const spendAlls = farmInfos.map(farmInfo => {
      const outTransfers = farmInfo.transfers.filter(transfer => transfer.direction === 'out')
      const symbols = getUniqueSymbolsFromUserInvestmentTransfer(outTransfers)
      const symbolInfos = symbols.map(tokenSymbol => {
        // This is no use but just in case we have more than 2 symbols and 2 transfers in sane transaction.
        const targets = outTransfers.filter(transfer => transfer.tokenSymbol === tokenSymbol)
        const tokenAmount = _.sumBy(targets, 'tokenAmount')
        const tokenValueUSD = _.sumBy(targets, 'tokenValueUSD')
        const tokenPriceUSD = tokenValueUSD / tokenAmount
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
    const spendGroup = _.groupBy(spendAlls, 'tokenSymbol')
    const spendGroups = Object.values(spendGroup)
    const spends = spendGroups.map(spend => {
      const tokenSymbol = spend[0].tokenSymbol
      const tokenAmount = _.sumBy(spend, 'tokenAmount')
      const tokenValueUSD = _.sumBy(spend, 'tokenValueUSD')
      const tokenPriceUSD = tokenValueUSD / tokenAmount

      return {
        tokenSymbol,
        tokenAmount,
        tokenPriceUSD,
        tokenValueUSD,
      }
    })

    const stratValueUSD = _.sumBy(farmInfos, 'stratValueUSD') || 0
    const principalValueUSD = _.sumBy(farmInfos, 'principalValueUSD') || 0
    const debtValueUSD = _.sumBy(farmInfos, 'borrowValueUSD') || 0
    const equityValueUSD = stratValueUSD + principalValueUSD
    const positionValueUSD = equityValueUSD + debtValueUSD
    const beginInvestedAt = farmInfos[farmInfos.length - 1].investedAt
    const endInvestedAt = farmInfos[0].investedAt

    return {
      positionId: farmInfos[0].positionId,
      farmName: farmInfos[0].farmName,
      vaultAddress: farmInfos[0].vaultAddress,
      stratSymbol: farmInfos[0].stratSymbol,
      principalSymbol: farmInfos[0].principalSymbol,
      spends,
      positionValueUSD,
      debtValueUSD,
      equityValueUSD,
      beginInvestedAt,
      endInvestedAt,
    }
  })

  return farmPositions
}

const getCurrentFarmEarns = (userCurrentBalances: ICurrentBalanceInfo[]) => {
  const earnCurrentFarms = userCurrentBalances
    .filter(e => e.investmentType === InvestmentTypeObject.farm)
  const earnCurrents = [...new Set(Object.values(_.groupBy(earnCurrentFarms, 'rewardPoolAddress')))]
    .map(e => ({
      rewardPoolName: e[0].rewardPoolName,
      rewardPoolAddress: e[0].rewardPoolAddress,
      rewardSymbol: e[0].rewardSymbol,
      rewardAmount: e[0].rewardAmount,
      rewardValueUSD: e[0].rewardValueUSD,
    }))

  return earnCurrents
}

const getFarmPNLs = (farmCurrents: ICurrentPosition[], farmSummaries: any[]) => {
  const farmPNLs = farmCurrents.map((farmCurrent, i) => {
    const farmSummary = farmSummaries[i]
    // farmCurrent.equityValueUSD === 0 mean closed position
    const profitValueUSD = farmCurrent.equityValueUSD > 0 ?
      farmCurrent.equityValueUSD - farmSummary.equityValueUSD :
      farmSummary.equityValueUSD

    return {
      farmName: farmCurrent.farmName,
      positionId: farmCurrent.positionId,
      equityValueUSD: farmCurrent.equityValueUSD,
      profitValueUSD,
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

  ///////// EARN /////////

  // TODO: Gathering from claim history?
  // const earnHistories = userInvestmentInfos.filter(e => e.investmentType === InvestmentTypeObject.farm) as IFarmInvestmentInfo[]
  const earnCurrents = getCurrentFarmEarns(userCurrentBalances)

  ///////// ALL /////////

  const res = {
    history: {
      farms: farmHistories,
      lends: lendHistories,
      stakes: stakeHistories,
    },
    summary: {
      farms: farmSummaries,
    },
    current: {
      farms: farmCurrents,
      lends: lendCurrents,
      stakes: stakeCurrents,
    },
    pnl: {
      rewards: earnCurrents,
      farms: farmPNLs,
      totalReward: _.sumBy(earnCurrents, 'rewardAmount'),
      totalRewardUSD: _.sumBy(earnCurrents, 'rewardValueUSD'),
      totalFarmsPNL: _.sumBy(farmPNLs, 'profitValueUSD'),
      totalFarmsEquity: _.sumBy(farmPNLs, 'equityValueUSD'),
    }
  }

  return res
}
