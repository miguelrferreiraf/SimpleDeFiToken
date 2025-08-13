# SimpleDeFiToken — guia rápido de reprodução

*Projeto do Capítulo 2 — Building Full Stack DeFi Applications (Samuel Zhou, 2024)*

---

> Resumo breve: repositório que contém um token ERC-20 simples (OpenZeppelin) desenvolvido com **Hardhat + Ethers (v6)**, com testes (Mocha+Chai) e uma função extra `transferWithAutoBurn` (queima automática de 10% do valor transferido). Este README explica passo-a-passo como clonar, instalar, executar localmente, testar e (opcional) fazer deploy para uma testnet como Sepolia.

---

## 1 — Pré-requisitos

* Node.js (≥16 recomendado; eu usei Node 22).
* npm ou yarn.
* Extensão MetaMask no navegador (para deploy em testnet).
* Conta em provedor RPC (Infura / MetaMask Developer / QuickNode) caso vá usar Sepolia.
* Nunca commit: `.env` com `PRIVATE_KEY`.

---

## 2 — Estrutura relevante do repositório

```
/defi-apps (root do app React + Hardhat)
  package.json
  hardhat.config.js
  /src/backend
    /contracts
      SimpleDeFiToken.sol
    /scripts
      deploy.js
    /artifacts  (gerado pelo compile)
    /cache
    /test
      SimpleDeFiToken.test.js
      Utils.js
  /public, /src               (React app criado com create-react-app)
  .env (gitignored)          -> API_URL, PRIVATE_KEY
  deployedAddress.json       -> gerado pelo script de deploy local (opcional)
```

---

## 3 — Arquivos-chave (conteúdo essencial — resumo)

### `src/backend/contracts/SimpleDeFiToken.sol`

Contrato ERC-20 (OpenZeppelin) com função adicional:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract SimpleDeFiToken is ERC20 {
    constructor() ERC20("Simple DeFi Token","SDFT") {
        _mint(msg.sender, 1e24);
    }
    function transferWithAutoBurn(address to, uint256 amount) public {
        require(balanceOf(msg.sender) >= amount, "Not enough tokens");
        uint256 burnAmount = amount / 10; // 10%
        _burn(msg.sender, burnAmount);
        _transfer(msg.sender, to, amount - burnAmount);
    }
}
```

### `src/backend/scripts/deploy.js` (exemplo, Ethers v6)

Script de deploy que grava `deployedAddress.json`:

```javascript
const fs = require("fs");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const factory = await ethers.getContractFactory("SimpleDeFiToken");
  const token = await factory.deploy();
  await token.waitForDeployment();
  const address = await token.getAddress();
  console.log("Simple DeFi Token Contract Address:", address);
  console.log("Deployer:", deployer.address);
  fs.writeFileSync("deployedAddress.json", JSON.stringify({ address }));
}
main().catch(e => { console.error(e); process.exitCode = 1; });
```

### `src/backend/test/Utils.js`

Funções utilitárias:

```javascript
const { ethers } = require("hardhat");
function toWei(amount) { return ethers.parseUnits(amount.toString(), "ether"); }
function fromWei(amount) { return ethers.formatUnits(amount, "ether"); }
module.exports = { toWei, fromWei };
```

### `src/backend/test/SimpleDeFiToken.test.js`

Testes (Mocha + Chai). Ex.: validação de `name`, `symbol`, `totalSupply`, `transfer`, `transferWithAutoBurn`. (Já adaptados para Ethers v6 e custom errors do OpenZeppelin.)

---

## 4 — Comandos (passo-a-passo) — após `git clone`

Assuma que o `git clone` deixou você na pasta que contém `defi-apps`. Se o repositório for somente `defi-apps`, adapte os caminhos.

1. Entrar na pasta do projeto:

```bash
cd defi-apps
```

2. Instalar dependências:

```bash
npm install
# Se faltar: npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
# e npm install @openzeppelin/contracts chai ethers
```

3. Rodar frontend React (opcional):

```bash
npm start
# abre http://localhost:3000 (se o projeto frontend existir)
```

4. **Testes automatizados** (usa nó Hardhat temporário):

```bash
npx hardhat test
```

> Resultado esperado: testes passando (ex.: 3 passing). O Hardhat sobe uma EVM temporária para executar os testes.

5. **Deploy local (manual) + interatividade**

* Em um terminal, rode o nó local (mantém contas destravadas):

```bash
npx hardhat node
```

* Em outro terminal, deploy no nó local:

```bash
npx hardhat run src/backend/scripts/deploy.js --network localhost
```

* (Opcional) abrir console Hardhat conectado ao `localhost`:

```bash
npx hardhat console --network localhost
# dentro do console:
const addr = require("./deployedAddress.json").address;
const contract = await ethers.getContractAt("SimpleDeFiToken", addr);
await contract.name(); // etc
```

6. **Deploy para Sepolia (testnet)** — *opcional*

* Criar `.env` no root (adicionar a `.gitignore`):

```
API_URL=https://sepolia.infura.io/v3/<SUA_KEY>
PRIVATE_KEY=<SUA_PRIVATE_KEY_SEPOLIA>
```

* Configurar `hardhat.config.js` (exemplo):

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const SEPOLIA_API_URL = process.env.API_URL;
const SEPOLIA_PRIVATE_KEY = process.env.PRIVATE_KEY;

module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: SEPOLIA_API_URL,
      accounts: [SEPOLIA_PRIVATE_KEY]
    }
  }
};
```

* Deploy:

```bash
npx hardhat run src/backend/scripts/deploy.js --network sepolia
```

* Verifique o endereço no explorer Sepolia (etherscan) e, se desejar, use o plugin de verificação do Hardhat para verificar fonte (requere API key do Etherscan / plugin).

---

## 5 — `package.json` — scripts recomendados

Adicione / garanta estas entradas em `package.json`:

```json
"scripts": {
  "start": "react-scripts start",
  "build": "react-scripts build",
  "test": "npx hardhat test",
  "node": "npx hardhat node",
  "deploy:localhost": "npx hardhat run src/backend/scripts/deploy.js --network localhost",
  "deploy:sepolia": "npx hardhat run src/backend/scripts/deploy.js --network sepolia"
}
```

(Isto facilita: `npm run test`, `npm run deploy:localhost`.)

---

## 6 — Boas práticas e dicas importantes (coisas que talvez você não saiba)

* **Nunca** comite o arquivo `.env` (ou chaves privadas). Adicione no `.gitignore`:

```
.env
deployedAddress.json
node_modules
/src/backend/artifacts
/src/backend/cache
```

* Hardhat `node` é **stateless** entre reinicios: se você parar o nó e reiniciá-lo, os contratos implantados anteriormente **não existirão mais**. Use `deployedAddress.json` após cada deploy local para manter o endereço da sessão atual.
* **Ethers v6 → diferenças**:

  * `contract.deployed()` (v5) → em v6 usar `await contract.waitForDeployment()` e `await contract.getAddress()`.
  * `getSigners()` retorna objetos com `address`; para saldo use `ethers.provider.getBalance(address)` em v6 (ou `deployer.getBalance()` se o signer o expor).
  * `ethers.utils.formatEther` (v5) → em v6 é `ethers.formatUnits`.
* **Reverts / mensagens de erro**:

  * OpenZeppelin recentes usam **custom errors** (ex.: `ERC20InsufficientBalance`) em vez de strings. Nos testes use `.to.be.revertedWithCustomError(token,"ERC20InsufficientBalance")` ou `.to.be.reverted` para ser genérico.
* **Testes**: `npx hardhat test` cria sua EVM temporária (mais rápido e isolado) — **não** é preciso rodar `npx hardhat node` antes dos testes.
* **Faucets Sepolia**: se for para Sepolia e precisar de ETH teste, use QuickNode / Infura faucets (ou outros). Algumas faucets exigem um mínimo ou limites por IP; considere usar outra faucet ou aguardar.
* **Verificação em Etherscan**: para verificar código, use plugin Etherscan/Hardhat e sua API key — mantenha a API key fora do git.

---

## 7 — Problemas comuns e correções rápidas

* **HH108: Cannot connect to network localhost**
  *Causa:* `npx hardhat node` não está rodando.
  *Solução:* abrir um terminal e executar `npx hardhat node` antes de conectar via console ou deploy com `--network localhost`.
* **could not decode result data / got empty result**
  *Causa:* endereço incorreto ou contrato não existe na rede atual (node foi reiniciado).
  *Solução:* redeploy e usar endereço atual (deployedAddress.json).
* **MODULE\_NOT\_FOUND: ./Utils**
  *Causa:* arquivo `Utils.js` não criado.
  *Solução:* criar `src/backend/test/Utils.js` conforme exemplo.
* **token.deployed is not a function / getBalance is not a function**
  *Causa:* mistura de exemplos v5 com Ethers v6.
  *Solução:* adaptar para Ethers v6 (`waitForDeployment()`, `ethers.provider.getBalance(...)`).

---

## 8 — Segurança & notas de produção

* O projeto é didático — **não** use o contrato tal qual em mainnet sem auditoria.
* `transferWithAutoBurn` queima tokens do remetente com `_burn(msg.sender, ...)` — pense consequências de contabilidade, relatórios e expectativas do usuário.
* Se pretende subir para mainnet, habilite otimização do compilador, fixe `solidity` com metadata e faça auditoria de segurança (reentrância, overflow, pausabilidade, renúncia de propriedade).
