# DeFarm
Decode Defi Farm for human readable.

## Features
- [x] `ALPACA`: fetchLendsBySymbols
- [x] `CAKE`: fetchFarmsWithAPRBySymbols
- [x] `CAKE`: fetchTokenUSDPricesBySymbols

## Installation
```
npm i
```

## Development
```
npm dev
```

## Test
```
npm test
npm test-dev
```

## Release
```
npm login
npm run release
```

## Example

### `CAKE` price
```typescript
import { pancakeswap } from '@undefiorg/defarm'
const results = await pancakeswap.fetchTokenUSDPricesBySymbols(['CAKE']);
console.log(results);
```

### `ALPACA`, `ETH`, `BNB` prices
```typescript
import { pancakeswap } from '@undefiorg/defarm'
const results = await fetchTokenUSDPricesBySymbols(['ALPACA', 'ETH', 'BNB']);
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
