import { ITransaction } from "../../type";
import { parseVaultInput } from "../vaults/worker";

export const withMethods = async (transactions: ITransaction[]) => {
  const methods = transactions.map(e => {
    const parsed = parseVaultInput(e.input)
    const transfer = {
      from_address: e.from_address,
      to_address: e.to_address,
      block_timestamp: e.block_timestamp,
      block_number: e.block_number,
    }

    return parsed ? { ...parsed, ...transfer } : transfer
  }).filter(e => e)

  const works = methods.filter(e => e['worker'])
  console.log(works)

  return methods
}
