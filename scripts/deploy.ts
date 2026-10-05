import { network } from "hardhat";

async function main() {
  const { ethers } =
    await network.connect();

  const [deployer] =
    await ethers.getSigners();

  console.log("");
  console.log("==============================");
  console.log("DEPLOY GAME ITEM MARKETPLACE");
  console.log("==============================");

  console.log(
    "Deployer:",
    deployer.address
  );

  // =====================================
  // DEPLOY GAME ITEM
  // =====================================

  console.log("");
  console.log(
    "Deploying GameItem..."
  );

  const GameItem =
    await ethers.getContractFactory(
      "GameItem"
    );

  const gameItem =
    await GameItem.deploy();

  await gameItem.waitForDeployment();

  const gameItemAddress =
    await gameItem.getAddress();

  console.log(
    "GameItem:",
    gameItemAddress
  );

  // =====================================
  // DEPLOY MARKETPLACE
  // =====================================

  console.log("");
  console.log(
    "Deploying Marketplace..."
  );

  const Marketplace =
    await ethers.getContractFactory(
      "Marketplace"
    );

  const marketplace =
    await Marketplace.deploy();

  await marketplace.waitForDeployment();

  const marketplaceAddress =
    await marketplace.getAddress();

  console.log(
    "Marketplace:",
    marketplaceAddress
  );

  console.log("");
  console.log("==============================");
  console.log("DEPLOY COMPLETED");
  console.log("==============================");

  console.log(
    "GAME_ITEM_ADDRESS =",
    gameItemAddress
  );

  console.log(
    "MARKETPLACE_ADDRESS =",
    marketplaceAddress
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});