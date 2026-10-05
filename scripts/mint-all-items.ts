import { network } from "hardhat";

async function main() {
  const { ethers } =
    await network.connect();

  const [owner] =
    await ethers.getSigners();

  console.log(
    "Mint account:",
    owner.address
  );

  const GAME_ITEM_ADDRESS =
    "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const gameItem =
    await ethers.getContractAt(
      "GameItem",
      GAME_ITEM_ADDRESS
    );

  // =====================================
  // DANH SÁCH 9 NFT
  // =====================================

  const items = [
    {
      name: "Dragon Sword",
      uri: "dragon-sword.json"
    },
    {
      name: "Shadow Dagger",
      uri: "shadow-dagger.json"
    },
    {
      name: "Frost Bow",
      uri: "frost-bow.json"
    },
    {
      name: "Magic Shield",
      uri: "magic-shield.json"
    },
    {
      name: "Dark Knight Armor",
      uri: "dark-knight-armor.json"
    },
    {
      name: "Dragon Helmet",
      uri: "dragon-helmet.json"
    },
    {
      name: "Neon Rifle Skin",
      uri: "neon-rifle.json"
    },
    {
      name: "Golden Rifle Skin",
      uri: "golden-rifle.json"
    },
    {
      name: "Cyber Blade",
      uri: "cyber-blade.json"
    }
  ];

  console.log("");
  console.log("==============================");
  console.log("MINT ALL GAME ITEMS");
  console.log("==============================");

  // =====================================
  // MINT TOKEN #1 -> #9
  // =====================================

  for (
    let i = 0;
    i < items.length;
    i++
  ) {
    const item = items[i];

    console.log("");
    console.log(
      `Minting Token #${i + 1}`
    );

    console.log(
      "Name:",
      item.name
    );

    console.log(
      "URI:",
      item.uri
    );

    const tx =
      await gameItem.mintItem(
        owner.address,
        item.uri
      );

    console.log(
      "Transaction:",
      tx.hash
    );

    await tx.wait();

    console.log(
      `Token #${i + 1} minted successfully`
    );
  }

  // =====================================
  // VERIFY OWNER
  // =====================================

  console.log("");
  console.log("==============================");
  console.log("VERIFY OWNERS");
  console.log("==============================");

  for (
    let tokenId = 1;
    tokenId <= items.length;
    tokenId++
  ) {
    const tokenOwner =
      await gameItem.ownerOf(
        tokenId
      );

    console.log(
      `Token #${tokenId}:`,
      tokenOwner
    );
  }

  console.log("");
  console.log("==============================");
  console.log("MINT COMPLETED");
  console.log("==============================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});