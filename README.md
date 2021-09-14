# DeFarm
Decode Defi Farm for human readable.

## Features
- [x] `ALPACA`: fetchLendsBySymbols
- [x] `CAKE`: fetchFarmsWithAPRBySymbols
- [x] `CAKE`: fetchTokenUSDPricesBySymbols
- [x] `ALPACA`: `USER` Get user's active position with addition info.
- [x] `CAKE`: `USER` fetchPoolReward

## TODO
- [x] `ALPACA`: `USER` Get account tx to get investment information.
- [ ] `ALPACA`: `USER` Monitor account for tx.
- [ ] Indexing user from `ALPACA` position from [Vault](https://bscscan.com/address/0x158da805682bdc8ee32d52833ad41e74bb951e59#readProxyContract).
- [ ] Try typechain.
- [ ] Try full archived node.

## Installation
```
yarn
```

## Development
```
yarn dev
```

## Test
```
yarn test
yarn test-dev
```

## Debug/Breakpoint
- [x] Code: By `SHIFT` + `OPTION` + `D`
- [x] Jest: By click `Debug` above each test.

## Release
```
yarn login
yarn run release
```

## Example: USD Price

### `CAKE` price from pancakeswap
```typescript
import { pancakeswap } from '@undefiorg/defarm'
const results = await pancakeswap.fetchTokenUSDPricesBySymbols(['CAKE']);
console.log(results);
```

### `ALPACA`, `ETH`, `BNB` prices from pancakeswap
```typescript
import { pancakeswap } from '@undefiorg/defarm'
const results = await pancakeswap.fetchTokenUSDPricesBySymbols(['ALPACA', 'ETH', 'BNB']);
console.log(results);
```
Result
```js
[
  {
    symbol: 'ALPACA',
    address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    busdPrice: '1.00027200234284325385719487150611180874813244976080643374535168075347660132703574'
  },
  {
    symbol: 'ETH',
    address: '0x8f0528ce5ef7b51152a59745befdd91d97091d2f',
    busdPrice: '1.14851987840623765655476356775155209753485267526754179724691496011441271322668135'
  },
  {
    symbol: 'BNB',
    address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    busdPrice: '1.00027200234284325385719487150611180874813244976080643374535168075347660132703574'
  }
]
```

### `ibALPACA` price from pancakeswap
```typescript
import { alpaca } from '@undefiorg/defarm'

// It's a good idea to check for supported symbols before calling fetchTokenUSDPricesBySymbols
const supportedSymbols = alpaca.getSupportedUSDSymbols()
console.log(supportedSymbols);

// Better use to fetch only supported `ibToken` prices
const [ibALPACA] = await alpaca.fetchTokenUSDPricesBySymbols(['ibALPACA'])
console.log(results);
```
---

## Example: Farm's info

### `ALPACA` lend info w/ price
```typescript
import { alpaca } from '@undefiorg/defarm'
const results = await alpaca.fetchLendsBySymbols(['ALPACA']);
console.log(results);
```

### `CAKE-BNB` pool info w/ price + APR
```typescript
import { pancakeswap } from '@undefiorg/defarm'
const results = await pancakeswap.fetchFarmsWithAPRBySymbols(['CAKE-BNB LP']);
console.log(results);
```

---

## Example: User's info

### Get user balance
```typescript
import { alpaca } from '@undefiorg/defarm'
const balances = await alpaca.fetchUserBalance('0x8155430e4860e791aeddb43e4764d15de7e0def1')
console.log(results);
```
Result
```js
[
  {
    symbol: "BNB",
    amount: 0.11599613269895288,
  },
  {
    symbol: "BUSD",
    name: "BUSD Token",
    address: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
    amount: 40,
  },
  {
    symbol: "Cake",
    name: "PancakeSwap Token",
    address: "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
    amount: 0.4911554974024814,
  },
  {
    symbol: "ALPACA",
    name: "AlpacaToken",
    address: "0x8f0528ce5ef7b51152a59745befdd91d97091d2f",
    amount: 36.16263249966178,
  }
]
```

### Get user related farm info
```typescript
import { alpaca } from '@undefiorg/defarm'
const lends = await alpaca.fetchUserLends('0x8155430e4860e791aeddb43e4764d15de7e0def1')
const stakes = await alpaca.fetchUserStakes('0x8155430e4860e791aeddb43e4764d15de7e0def1')
```

### TODO
- [x] Record today price every 5 minutes.
- [x] Fix `debtValue` is amount (currently assume as `USD`).
- [x] mean with weight.
- [x] Add equity to current.farms.
- [x] Add total position,debt,equity to summary.farms.
- [ ] Find close position state.
- [ ] Add `kill` support.
- [ ] Use `0x0002e89a801bf95a131fbbbdfd3097fa84809d7c` for stress kill test.
