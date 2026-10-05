import { expect } from "chai";
import { network } from "hardhat";

describe("Marketplace", function () {

  // ==================================================
  // TEST 1: DANG BAN VA MUA NFT
  // ==================================================
  it("Should list and buy an NFT", async function () {
    const { ethers } = await network.connect();

    const [owner, seller, buyer] = await ethers.getSigners();

    // 1. Deploy GameItem
    const GameItem = await ethers.getContractFactory("GameItem");
    const gameItem = await GameItem.deploy();

    await gameItem.waitForDeployment();

    // 2. Deploy Marketplace
    const Marketplace =
      await ethers.getContractFactory("Marketplace");

    const marketplace = await Marketplace.deploy();

    await marketplace.waitForDeployment();

    // 3. Mint NFT cho seller
    await gameItem.mintItem(
      seller.address,
      "https://example.com/dragon-sword.json"
    );

    expect(await gameItem.ownerOf(1))
      .to.equal(seller.address);

    // 4. Seller approve Marketplace
    const marketplaceAddress =
      await marketplace.getAddress();

    await gameItem
      .connect(seller)
      .approve(marketplaceAddress, 1);

    // 5. Seller dang ban NFT
    const price = ethers.parseEther("1");

    await marketplace
      .connect(seller)
      .listItem(
        await gameItem.getAddress(),
        1,
        price
      );

    // Kiem tra listing
    const listing = await marketplace.listings(1);

    expect(listing.seller)
      .to.equal(seller.address);

    expect(listing.price)
      .to.equal(price);

    expect(listing.active)
      .to.equal(true);

    // 6. Buyer mua NFT
    await marketplace
      .connect(buyer)
      .buyItem(1, {
        value: price
      });

    // 7. Kiem tra NFT da chuyen sang buyer
    expect(await gameItem.ownerOf(1))
      .to.equal(buyer.address);

    // Listing phai dong
    const updatedListing =
      await marketplace.listings(1);

    expect(updatedListing.active)
      .to.equal(false);
  });


  // ==================================================
  // TEST 2: HUY DANG BAN NFT
  // ==================================================
  it("Should cancel a listing", async function () {
    const { ethers } = await network.connect();

    const [owner, seller] = await ethers.getSigners();

    // 1. Deploy GameItem
    const GameItem = await ethers.getContractFactory("GameItem");

    const gameItem = await GameItem.deploy();

    await gameItem.waitForDeployment();

    // 2. Deploy Marketplace
    const Marketplace =
      await ethers.getContractFactory("Marketplace");

    const marketplace = await Marketplace.deploy();

    await marketplace.waitForDeployment();

    // 3. Mint NFT cho seller
    await gameItem.mintItem(
      seller.address,
      "https://example.com/shield.json"
    );

    expect(await gameItem.ownerOf(1))
      .to.equal(seller.address);

    // 4. Seller approve Marketplace
    await gameItem
      .connect(seller)
      .approve(
        await marketplace.getAddress(),
        1
      );

    // 5. Dang ban NFT voi gia 0.5 ETH
    const price = ethers.parseEther("0.5");

    await marketplace
      .connect(seller)
      .listItem(
        await gameItem.getAddress(),
        1,
        price
      );

    // Kiem tra listing dang active
    let listing = await marketplace.listings(1);

    expect(listing.active)
      .to.equal(true);

    // 6. Seller huy dang ban
    await marketplace
      .connect(seller)
      .cancelListing(1);

    // 7. Kiem tra listing da bi huy
    listing = await marketplace.listings(1);

    expect(listing.active)
      .to.equal(false);

    // 8. NFT van thuoc seller
    expect(await gameItem.ownerOf(1))
      .to.equal(seller.address);
  });

});