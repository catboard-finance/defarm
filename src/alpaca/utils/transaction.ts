import { ITransaction, MethodType } from "../../type";
import { getTokenFromIBSymbol } from "../core";
import { parseVaultInput } from "../vaults/worker";

export interface ITransactionWithMethod extends ITransaction {
  method: MethodType
}

enum InvestmentTypeObject {
  farms = 'farms',
  lends = 'lends',
  stakes = 'stakes',
  none = 'none',
}

export interface ITransactionWithMethodType extends ITransactionWithMethod {
  investmentType: InvestmentTypeObject
}

export const withMethods = async (transactions: ITransaction[]): Promise<ITransactionWithMethod[]> => {
  const res = transactions.map(e => {
    const parsed = parseVaultInput(e.input)
    const transfer = {
      from_address: e.from_address,
      to_address: e.to_address,
      block_timestamp: e.block_timestamp,
      block_number: e.block_number,
    }

    return parsed ? { ...parsed, ...transfer } : transfer
  }).filter(e => e)
  return res
}

export const withType = async (transactions: ITransactionWithMethod[]): Promise<ITransactionWithMethodType[]> => {
  const res = transactions.map(e => {
    switch (e.method) {
      case MethodType.approve:
        return {
          ...e,
          investmentType: null,
        }
      case MethodType.deposit:
        // lends or stake
        const ibSymbol = getTokenFromIBSymbol(e.to_address)
        return {
          ...e,
          investmentType: ibSymbol ? InvestmentTypeObject.lends : InvestmentTypeObject.stakes,
        }
      case MethodType.transfer:
        return {
          ...e,
          investmentType: InvestmentTypeObject.none,
        }
      case MethodType.work:
        // farms
        return {
          ...e,
          investmentType: InvestmentTypeObject.farms,
        }
      default:
        return {
          ...e,
          investmentType: InvestmentTypeObject.none,
        }
    }
  })

  return res
}