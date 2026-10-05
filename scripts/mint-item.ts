import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const [owner] = await ethers.getSigners();

  // Địa chỉ GameItem đã deploy
  const gameItemAddress =
    "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const gameItem = await ethers.getContractAt(
    "GameItem",
    gameItemAddress
  );

  console.log("Minting NFT...");
  console.log("Owner:", owner.address);

  const tx = await gameItem.mintItem(
    owner.address,
    "https://example.com/dragon-sword.json"
  );

  await tx.wait();

  console.log("Mint successful!");
  console.log("Token ID: 1");

  const nftOwner = await gameItem.ownerOf(1);

  console.log("NFT Owner:", nftOwner);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});