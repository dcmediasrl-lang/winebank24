import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploy con wallet:", deployer.address);

  const WineBank = await ethers.getContractFactory("WineBank24");
  const contract = await WineBank.deploy(deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("Contratto deployato a:", address);
  console.log("Aggiorna NFT_CONTRACT_ADDRESS nel file .env con questo indirizzo");
}

main().catch((e) => { console.error(e); process.exit(1); });
