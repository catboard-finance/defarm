const _info = {
  transactions: [
    {
      positionId: "9967403",

      vaultAddress: "0x3fc149995021f1d7aec54d015dad3c7abc952bf0",
      stratAddress: "0x50380Ac8DA73D73719785F0A4433192F4e0E6c90",

      tokenSymbol: "ALPACA",
      tokenAddress: "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F",
      tokenAmount: 695.245603609934955053,

      tokenPriceUSD: 1042.8684054149,

      blockNumber: "10277278",
      blockHash: "0x9673166f4eb5e5f7a224d40ec2d3572777f51badf2e6ce7ed5bfb373b6325e06",
      blockTimestamp: "2021-08-07T14:45:51.000Z",
    },
    {
      positionId: "9967403",
      vaultAddress: "0x7c9e73d4c71dae564d41f78d56439bb4ba87592f",
      stratAddress: "0x50380Ac8DA73D73719785F0A4433192F4e0E6c90",
      tokenSymbol: "BUSD",
      tokenAddress: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
      tokenAmount: 504.503765091159716219,
      tokenPriceUSD: 504.503765091159716219,
      block_number: "10277278",
      block_timestamp: "2021-08-07T14:45:51.000Z",
      block_hash: "0x9673166f4eb5e5f7a224d40ec2d3572777f51badf2e6ce7ed5bfb373b6325e06"
    },
    {
      positionId: "1967402",
      vaultAddress: "0x3fc149995021f1d7aec54d015dad3c7abc952bf0",
      stratAddress: "0x50380Ac8DA73D73719785F0A4433192F4e0E6c90",
      tokenSymbol: "ALPACA",
      tokenAddress: "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F",
      tokenAmount: 577.406596699668932514,
      priceUSD: 519.6659370297,
      block_number: "10277278",
      block_timestamp: "2021-08-11T06:37:01.000Z",
      block_hash: "0x9673166f4eb5e5f7a224d40ec2d3572777f51badf2e6ce7ed5bfb373b6325e06"
    },
  ],
  farms: [
    {
      positionId: "9967403",

      depositValueUSD: 1000,
      equityValueUSD: 1000,
      debtValueUSD: 100,
      profitValueUSD: 900,

      vaultAddress: "0x158da805682bdc8ee32d52833ad41e74bb951e59",
      vaultTokenSymbol: "USDT",
      principalAmount: 0,

      stratAddress: "0x50380Ac8DA73D73719785F0A4433192F4e0E6c90",
      stratTokenSymbol: "CAKE",
      stratAmount: 128,

      borrowAmount: 0,

      positionedAt: "2021-08-07T14:45:51.000Z",

      transfers: [
        {
          from: "0x8155430e4860e791aeddb43e4764d15de7e0def1",
          to: "0x158da805682bdc8ee32d52833ad41e74bb951e59",
          direction: "out",
          tokenSymbol: "CAKE",
          tokenAddress: "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F",
          tokenAmount: 1272.6522003096,
          tokenPriceUSD: 1527.12000,
        },
        {
          from: "0x8155430e4860e791aeddb43e4764d15de7e0def1",
          to: "0x158da805682bdc8ee32d52833ad41e74bb951e59",
          direction: "out",
          tokenSymbol: "USDT",
          tokenAddress: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
          tokenAmount: 504.503765091159716219,
          tokenPriceUSD: 504.503765091159716219,
        }
      ],
    },
  ],
  lends: [
    {
      name: 'ALPACA',
      deposits: {},
      depositSummary: [],

      totalDepositUSD: 1272.6522003096,
      totalWithdrawUSD: 1272.6522003096,

      totalEquityUSD: 1272.6522003096,

      totalProfitAmount: 1272.6522003096,
      totalProfitUSD: 1272.6522003096,

      token: {
        "ALPACA": 1272.6522003096,
        "BUSD": 504.503765091159716219,
      },

      at: "2021-08-07T14:45:51.000Z",
    }
  ],
  stakes: [
    {
      name: 'ALPACA',
      deposits: {},
      depositSummary: [],

      totalDepositUSD: 1272.6522003096,
      totalWithdrawUSD: 1272.6522003096,

      totalEquityUSD: 1272.6522003096,

      totalProfitAmount: 1272.6522003096,
      totalProfitUSD: 1272.6522003096,

      token: {
        "ALPACA": 1272.6522003096,
        "BUSD": 504.503765091159716219,
      },

      at: "2021-08-07T14:45:51.000Z",
    }
  ],
}

const _summary = {
  farmSummaries: [
    {
      positionId: "9967403",

      totalDepositUSD: 1272.6522003096,
      totalWithdrawUSD: 1272.6522003096,

      totalPositionUSD: 1272.6522003096,
      totalDebtUSD: 1272.6522003096,

      totalEquityUSD: 1272.6522003096,

      totalProfitAmount: 1272.6522003096,
      totalProfitUSD: 1272.6522003096,

      token: {
        "ALPACA": 1272.6522003096,
        "BUSD": 504.503765091159716219,
      },

      at: "2021-08-07T14:45:51.000Z",
    },
  ],
}

const _portfolio = {
  totalInvestUSD: 1272.6522003096,
  totalHarvestUSD: 1272.6522003096,

  totalEquityUSD: 1272.6522003096,
  totalProfitUSD: 1272.6522003096,

  tokenPortion: {
    "ALPACA": 1272.6522003096,
    "BUSD": 504.503765091159716219,
  },
}
