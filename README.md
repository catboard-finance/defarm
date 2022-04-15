# DeFarm

Decode Defi Farm for human readable.

## Features

- [x] `ALPACA`: fetchLendsBySymbols
- [x] `CAKE`: fetchFarmsWithAPRBySymbols
- [x] `CAKE`: fetchTokenUSDPricesBySymbols
- [x] `ALPACA`: `USER` Get user's active position with addition info.
- [x] `CAKE`: `USER` fetchPoolReward
- [x] `ALPACA`: `USER` Get account tx to get investment information.

## Installation

```
npm
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

## Use
```
## Copy and fill all env var for RPC endpoint
cp .env.example .env
code .env
```

## Example: USD Price

### `CAKE` price from pancakeswap

```typescript
import { pancakeswap } from '@undefiorg/defarm'
const results = await pancakeswap.fetchTokenUSDPricesBySymbols(['CAKE'])
console.log(results)
```

### `ALPACA`, `ETH`, `BNB` prices from pancakeswap

```typescript
import { pancakeswap } from '@undefiorg/defarm'
const results = await pancakeswap.fetchTokenUSDPricesBySymbols(['ALPACA', 'ETH', 'BNB'])
console.log(results)
```

### `ibALPACA` price from pancakeswap

```typescript
import { alpaca } from '@undefiorg/defarm'

// It's a good idea to check for supported symbols before calling fetchTokenUSDPricesBySymbols
const supportedSymbols = alpaca.getSupportedUSDSymbols()
console.log(supportedSymbols)

// Better use to fetch only supported `ibToken` prices
const [ibALPACA] = await alpaca.fetchTokenUSDPricesBySymbols(['ibALPACA'])
console.log(results)
```

---

## Example: Farm's info

### `ALPACA` lend info w/ price

```typescript
import { alpaca } from '@undefiorg/defarm'
const results = await alpaca.fetchLendsBySymbols(['ALPACA'])
console.log(results)
```

### `CAKE-BNB` pool info w/ price + APR

```typescript
import { pancakeswap } from '@undefiorg/defarm'
const results = await pancakeswap.fetchFarmsWithAPRBySymbols(['CAKE-BNB LP'])
console.log(results)
```

---

## Example: User's info

### Get user balance

```typescript
import { alpaca } from '@undefiorg/defarm'
const balances = await alpaca.fetchUserBalance('0x8155430e4860e791aeddb43e4764d15de7e0def1')
console.log(results)
```

### Get user related farm info

```typescript
import { alpaca } from '@undefiorg/defarm'
const lends = await alpaca.fetchUserLends('0x8155430e4860e791aeddb43e4764d15de7e0def1')
const stakes = await alpaca.fetchUserStakes('0x8155430e4860e791aeddb43e4764d15de7e0def1')
```

### TODO

- [ ] fix wrong symbol name which grab from event.
- [ ] Support `addCollateral` with debt.
- [ ] summary `stake`, `lend`.
- [ ] Define `liquidate` position state.
- [ ] Add all `kill` related support.
- [ ] Use `0x0002e89a801bf95a131fbbbdfd3097fa84809d7c` for stress kill test.
- [ ] `kill` in action https://bscscan.com/tx/0xc14748b07056596783c7054dc1b345283aa4e39846ba13fb7084621b7f37f1f8
- [ ] `kill` list https://explorer.bitquery.io/bsc/txs/calls?contract=0xd7d069493685a581d27824fc46eda46b7efc0063&method=d29a0025
- [ ] add `AUSD` support.
- [ ] more unit test!
