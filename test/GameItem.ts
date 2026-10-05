import { expect } from "chai";
import { network } from "hardhat";

describe("GameItem", function () {
  it("Should mint an NFT", async function () {
    const { ethers } = await network.connect();

    // Lấy 2 tài khoản test
    const [owner, player] = await ethers.getSigners();

    // Deploy contract
    const GameItem = await ethers.getContractFactory("GameItem");
    const gameItem = await GameItem.deploy();

    await gameItem.waitForDeployment();

    // Mint NFT cho player
    await gameItem.mintItem(
      player.address,
      "https://example.com/dragon-sword.json"
    );

    // Kiểm tra NFT #1 thuộc về player
    expect(await gameItem.ownerOf(1)).to.equal(player.address);

    // Kiểm tra metadata URI
    expect(await gameItem.tokenURI(1)).to.equal(
      "https://example.com/dragon-sword.json"
    );
  });
});