# deFarm
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

### `ALPACA` lend info w/ price
```typescript
import { alpaca } from '@undefiorg/defarm'
alpaca.fetchLendsBySymbols(['ALPACA']).then(console.log)
```

### `CAKE` price
```typescript
import { pancake } from '@undefiorg/defarm'
pancake.fetchFarmsWithAPRBySymbols(['CAKE-BNB LP']).then(console.log)
```

### `CAKE-BNB` pool info
```typescript
import { pancake } from '@undefiorg/defarm'
pancake.fetchTokenUSDPricesBySymbols(['CAKE']).then(console.log)
```
