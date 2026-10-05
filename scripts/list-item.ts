import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const [seller] = await ethers.getSigners();

  const gameItemAddress =
    "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const marketplaceAddress =
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  const gameItem = await ethers.getContractAt(
    "GameItem",
    gameItemAddress
  );

  const marketplace = await ethers.getContractAt(
    "Marketplace",
    marketplaceAddress
  );

  const tokenId = 1;

  // Giá bán NFT
  const price = ethers.parseEther("1");

  console.log("Seller:", seller.address);
  console.log("Token ID:", tokenId);
  console.log("Price: 1 ETH");

  // ==========================
  // 1. KIỂM TRA OWNER
  // ==========================

  const owner = await gameItem.ownerOf(tokenId);

  console.log("");
  console.log("Current NFT owner:");
  console.log(owner);

  // ==========================
  // 2. APPROVE MARKETPLACE
  // ==========================

  console.log("");
  console.log("Approving Marketplace...");

  const approveTx = await gameItem.approve(
    marketplaceAddress,
    tokenId
  );

  await approveTx.wait();

  console.log("Approve successful!");

  // ==========================
  // 3. LIST NFT
  // ==========================

  console.log("");
  console.log("Listing NFT...");

  const listTx = await marketplace.listItem(
    gameItemAddress,
    tokenId,
    price
  );

  await listTx.wait();

  console.log("Listing successful!");

  // ==========================
  // 4. KIỂM TRA LISTING
  // ==========================

  const listingCount =
    await marketplace.listingCount();

  const listing =
    await marketplace.listings(listingCount);

  console.log("");
  console.log("===== LISTING =====");

  console.log(
    "Listing ID:",
    listingCount.toString()
  );

  console.log(
    "Seller:",
    listing.seller
  );

  console.log(
    "Token ID:",
    listing.tokenId.toString()
  );

  console.log(
    "Price:",
    ethers.formatEther(listing.price),
    "ETH"
  );

  console.log(
    "Active:",
    listing.active
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});