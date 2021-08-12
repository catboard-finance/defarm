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
npm test-watch
```

## Release
```
npm login
npm run release
```

## Example

### `CAKE` price
```typescript
import { pancake } from '@undefiorg/defarm'
pancake.fetchTokenUSDPricesBySymbols(['CAKE']).then(console.log)
```

### `ALPACA`, `BNB` prices
```typescript
import { pancake } from '@undefiorg/defarm'
const results = await fetchTokenUSDPricesBySymbols(['ALPACA', 'BNB']).then(console.log)
```

### `ALPACA` lend info w/ price
```typescript
import { alpaca } from '@undefiorg/defarm'
alpaca.fetchLendsBySymbols(['ALPACA']).then(console.log)
```

### `CAKE-BNB` pool info w/ price + APR
```typescript
import { pancake } from '@undefiorg/defarm'
pancake.fetchFarmsWithAPRBySymbols(['CAKE-BNB LP']).then(console.log)
```
