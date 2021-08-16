# DeFarm
Decode Defi Farm for human readable.

## Features
- [x] `ALPACA`: fetchLendsBySymbols
- [x] `CAKE`: fetchFarmsWithAPRBySymbols
- [x] `CAKE`: fetchTokenUSDPricesBySymbols

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

## Example: Info

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
