import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const [deployer] = await ethers.getSigners();

  console.log("Deploying with account:");
  console.log(deployer.address);

  // =========================
  // DEPLOY GAMEITEM
  // =========================
  const GameItem =
    await ethers.getContractFactory("GameItem");

  const gameItem =
    await GameItem.deploy();

  await gameItem.waitForDeployment();

  const gameItemAddress =
    await gameItem.getAddress();

  console.log("");
  console.log("GameItem deployed to:");
  console.log(gameItemAddress);

  // =========================
  // DEPLOY MARKETPLACE
  // =========================
  const Marketplace =
    await ethers.getContractFactory("Marketplace");

  const marketplace =
    await Marketplace.deploy();

  await marketplace.waitForDeployment();

  const marketplaceAddress =
    await marketplace.getAddress();

  console.log("");
  console.log("Marketplace deployed to:");
  console.log(marketplaceAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});