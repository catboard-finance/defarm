import _ from "lodash"
import { IGetPositionParams, withCurrentPosition } from "./position";
import { IFarmInvestmentInfo, ILendInvestmentInfo, IStakeInvestmentInfo, IUserInvestmentInfo, IUserInvestmentTransfer } from "./investment";
import { InvestmentTypeObject } from "../utils/transaction";
import { ICurrentBalanceInfo } from "./current";

// const sumFarmEarning = (farms: IFarmInvestmentInfo[]) => {
//   return {
//     spendValueUSD: _.sumBy(farms, "principalValueUSD"),
//     returnValueUSD: _.sumBy(farms, "rewardValueUSD"),
//   }
// }

// const sumLendEarning = (lends: ILendInvestmentInfo[]) => {
//   return {
//     depositValueUSD: _.sumBy(lends, "depositValueUSD"),
//     rewardValueUSD: _.sumBy(lends, "rewardValueUSD"),
//   }
// }

// const sumStakeEarning = (stakes: IStakeInvestmentInfo[]) => {
//   return {
//     stakeValueUSD: _.sumBy(stakes, "stakeValueUSD"),
//     rewardValueUSD: _.sumBy(stakes, "rewardValueUSD"),
//   }
// }

const getUniqueSymbolsFromUserInvestmentTransfer = (transfers: IUserInvestmentTransfer[]) => {
  return [...new Set(transfers.map(transfer => transfer.tokenSymbol))]
}

const withPositionSummaries = (farmHistories: IFarmInvestmentInfo[]) => {
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

        return {
          tokenSymbol,
          tokenAmount,
          tokenPriceUSD,
          tokenValueUSD,
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

    return {
      positionId: farmInfos[0].positionId,
      farmName: farmInfos[0].farmName,
      vaultAddress: farmInfos[0].vaultAddress,
      spends,
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

// const withPositionSummary = (farmHistories: IFarmInvestmentInfo[]) => {
//   return farmHistories.map
// }

export const getInvestmentSummary = async (userInvestmentInfos: IUserInvestmentInfo[], userCurrentBalances: ICurrentBalanceInfo[]) => {

  ///////// HISTORY /////////

  const farmHistories = userInvestmentInfos.filter(e => e.investmentType === InvestmentTypeObject.farm) as IFarmInvestmentInfo[]
  const lendHistories = userInvestmentInfos.filter(e => e.investmentType === InvestmentTypeObject.lend) as ILendInvestmentInfo[]
  const stakeHistories = userInvestmentInfos.filter(e => e.investmentType === InvestmentTypeObject.stake) as IStakeInvestmentInfo[]

  ///////// SUMMARY /////////

  const farmSummaries = withPositionSummaries(farmHistories)

  ///////// CURRENT /////////

  const farmCurrents = await withCurrentPosition(farmSummaries as IGetPositionParams[])
  const lendCurrents = userCurrentBalances.filter(e => e.investmentType === InvestmentTypeObject.lend)
  const stakeCurrents = userCurrentBalances.filter(e => e.investmentType === InvestmentTypeObject.stake)

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
    earn: {
      farm: earnCurrents,
    }
  }

  return res
}
