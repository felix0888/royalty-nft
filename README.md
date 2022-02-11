# Royalty NFT

## Requirement
All the requirements are in the document shared.

## Configuration
You need to rename or clone `.env` file in the root to set the environment variables listed below.
```env
INFURA_PROJECT_ID=
ETHERSCAN_API_KEY=
BINANCE_API_KEY=
PRIVATE_KEY=
REPORT_GAS=
```

## Deployment
We're deploying the smart contracts to the Binance Smart Chain testnet.
`WBNB` is going to be the payment token in the marketplace contract, so we need to specify the address of the `WBNB` token which is `0xae13d989dac2f0debff460ac112a837c89baa7cd` on the testnet.

We can deploy & verify the scripts by using...
```console
npx hardhat run --network bsctest scripts/deploy.js
```

### Deployed Address
NFT Contract: [0x03fe4078Ef608E1E2cA3a2a3ab200CD2036Ce838](https://testnet.bscscan.com/address/0x03fe4078Ef608E1E2cA3a2a3ab200CD2036Ce838#code)

Marketplace Contract: [0xF03c8DdECC7Ff2aee82F1136eD0a7e7138A508f6](https://testnet.bscscan.com/address/0xF03c8DdECC7Ff2aee82F1136eD0a7e7138A508f6#code)

## Test
```console
npx hardhat test
```
### Gas report
You can just set the `REPORT_GAS` as `true` on the `.env` file and then run the above command on the terminal.
```
·-------------------------------------|---------------------------|------------|-----------------------------·
|         Solc version: 0.8.4         ·  Optimizer enabled: true  ·  Runs: 20  ·  Block limit: 30000000 gas  │
······································|···························|············|······························
|  Methods                                                                                                   │
················|·····················|·············|·············|············|···············|··············
|  Contract     ·  Method             ·  Min        ·  Max        ·  Avg       ·  # calls      ·  usd (avg)  │
················|·····················|·············|·············|············|···············|··············
|  Marketplace  ·  purchase           ·     149604  ·     153444  ·    150564  ·            4  ·          -  │
················|·····················|·············|·············|············|···············|··············
|  Marketplace  ·  setForSale         ·      36456  ·      58469  ·     54800  ·           12  ·          -  │
················|·····················|·············|·············|············|···············|··············
|  MockERC20    ·  approve            ·      46233  ·      46245  ·     46243  ·            5  ·          -  │
················|·····················|·············|·············|············|···············|··············
|  MockERC20    ·  transfer           ·      51702  ·      51714  ·     51711  ·           60  ·          -  │
················|·····················|·············|·············|············|···············|··············
|  OricaNFT     ·  safeMint           ·          -  ·          -  ·    276673  ·           17  ·          -  │
················|·····················|·············|·············|············|···············|··············
|  OricaNFT     ·  setApprovalForAll  ·      46498  ·      46510  ·     46509  ·           12  ·          -  │
················|·····················|·············|·············|············|···············|··············
|  Deployments                        ·                                        ·  % of limit   ·             │
······································|·············|·············|············|···············|··············
|  Marketplace                        ·     796684  ·     796696  ·    796695  ·        2.7 %  ·          -  │
······································|·············|·············|············|···············|··············
|  MockERC20                          ·          -  ·          -  ·    638527  ·        2.1 %  ·          -  │
······································|·············|·············|············|···············|··············
|  OricaNFT                           ·          -  ·          -  ·   2028658  ·        6.8 %  ·          -  │
·-------------------------------------|-------------|-------------|------------|---------------|-------------·
```

### Coverage Report
You can run `npx hardhat coverage` to check the statement and branch coverage of the smart contracts.
```console
------------------|----------|----------|----------|----------|----------------|
File              |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
------------------|----------|----------|----------|----------|----------------|
 contracts/       |    93.48 |    92.31 |    84.62 |    93.48 |                |
  Marketplace.sol |     96.3 |       90 |      100 |     96.3 |             66 |
  OricaNFT.sol    |    89.47 |      100 |    77.78 |    89.47 |          55,67 |
 contracts/test/  |      100 |      100 |      100 |      100 |                |
  MockERC20.sol   |      100 |      100 |      100 |      100 |                |
------------------|----------|----------|----------|----------|----------------|
All files         |    93.62 |    92.31 |    85.71 |    93.62 |                |
------------------|----------|----------|----------|----------|----------------|

> Istanbul reports written to ./coverage/ and ./coverage.json
```

For better seeing, please check the `./coverage/index.html` file which looks like these.
![Screenshot 2022-02-11 18:22:58](https://user-images.githubusercontent.com/45418310/153683908-8036e31f-2aa6-4b67-8b2e-e0a8625604ec.png)

![Screenshot 2022-02-11 18:24:11](https://user-images.githubusercontent.com/45418310/153683972-ff904a1c-954d-4f9a-b806-b2b593932ff9.png)

If you're familiar with hardhat console, you can test the contracts on the hardhat local node by using `npx hardhat node` and `npx hardhat console` commands.
