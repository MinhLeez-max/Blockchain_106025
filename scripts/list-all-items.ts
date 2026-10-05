import { network } from "hardhat";

async function main() {
  const { ethers } =
    await network.connect();

  const [seller] =
    await ethers.getSigners();

  console.log(
    "Seller:",
    seller.address
  );

  const GAME_ITEM_ADDRESS =
    "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const MARKETPLACE_ADDRESS =
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  const gameItem =
    await ethers.getContractAt(
      "GameItem",
      GAME_ITEM_ADDRESS,
      seller
    );

  const marketplace =
    await ethers.getContractAt(
      "Marketplace",
      MARKETPLACE_ADDRESS,
      seller
    );

  // =====================================
  // DANH SÁCH GIÁ
  // =====================================

  const items = [
    {
      tokenId: 1,
      name: "Dragon Sword",
      price: "1"
    },
    {
      tokenId: 2,
      name: "Shadow Dagger",
      price: "0.45"
    },
    {
      tokenId: 3,
      name: "Frost Bow",
      price: "0.6"
    },
    {
      tokenId: 4,
      name: "Magic Shield",
      price: "0.5"
    },
    {
      tokenId: 5,
      name: "Dark Knight Armor",
      price: "1.2"
    },
    {
      tokenId: 6,
      name: "Dragon Helmet",
      price: "0.75"
    },
    {
      tokenId: 7,
      name: "Neon Rifle Skin",
      price: "0.35"
    },
    {
      tokenId: 8,
      name: "Golden Rifle Skin",
      price: "0.9"
    },
    {
      tokenId: 9,
      name: "Cyber Blade",
      price: "0.55"
    }
  ];

  console.log("");
  console.log("==============================");
  console.log("LIST ALL GAME ITEMS");
  console.log("==============================");

  // =====================================
  // APPROVE TẤT CẢ NFT CHO MARKETPLACE
  // =====================================

  console.log("");
  console.log(
    "Approving Marketplace..."
  );

  const approveTx =
    await gameItem.setApprovalForAll(
      MARKETPLACE_ADDRESS,
      true
    );

  console.log(
    "Approve TX:",
    approveTx.hash
  );

  await approveTx.wait();

  console.log(
    "Marketplace approved!"
  );

  // =====================================
  // LIST TỪNG NFT
  // =====================================

  for (const item of items) {
    console.log("");
    console.log(
      `Listing Token #${item.tokenId}`
    );

    console.log(
      "Name:",
      item.name
    );

    console.log(
      "Price:",
      `${item.price} ETH`
    );

    // Kiểm tra owner
    const owner =
      await gameItem.ownerOf(
        item.tokenId
      );

    if (
      owner.toLowerCase() !==
      seller.address.toLowerCase()
    ) {
      console.log(
        "SKIPPED - Seller is not owner"
      );

      continue;
    }

    const price =
      ethers.parseEther(
        item.price
      );

    const tx =
      await marketplace.listItem(
        GAME_ITEM_ADDRESS,
        item.tokenId,
        price
      );

    console.log(
      "Transaction:",
      tx.hash
    );

    await tx.wait();

    console.log(
      `Token #${item.tokenId} listed successfully`
    );
  }

  // =====================================
  // VERIFY
  // =====================================

  console.log("");
  console.log("==============================");
  console.log("VERIFY LISTINGS");
  console.log("==============================");

  const listingCount =
    await marketplace.listingCount();

  console.log(
    "Listing Count:",
    listingCount.toString()
  );

  for (
    let listingId = 1;
    listingId <= Number(listingCount);
    listingId++
  ) {
    const listing =
      await marketplace.listings(
        listingId
      );

    console.log("");
    console.log(
      `Listing #${listingId}`
    );

    console.log(
      "Token:",
      listing.tokenId.toString()
    );

    console.log(
      "Seller:",
      listing.seller
    );

    console.log(
      "Price:",
      ethers.formatEther(
        listing.price
      ),
      "ETH"
    );

    console.log(
      "Active:",
      listing.active
    );
  }

  console.log("");
  console.log("==============================");
  console.log("LISTING COMPLETED");
  console.log("==============================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});