import { useEffect, useState } from "react";
import {
  BrowserProvider,
  Contract,
  formatEther
} from "ethers";

import type { Item } from "../components/ItemCard";

import {
  GAME_ITEM_ADDRESS,
  GAME_ITEM_ABI,
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI
} from "../blockchain/contracts";

import {
  loadAllListings,
  findLatestListing
} from "../blockchain/listingHelpers";

type Props = {
  account: string;
};

type OwnedItem = Item & {
  isForSale: boolean;
  blockchainPrice?: string;
  latestListingId?: number;
};

function MyItems({ account }: Props) {
  const [myItems, setMyItems] =
    useState<OwnedItem[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [cancellingId, setCancellingId] =
    useState<number | null>(null);

  // =====================================
  // ACCOUNT THAY ĐỔI -> LOAD LẠI
  // =====================================

  useEffect(() => {
    if (!account) {
      setMyItems([]);
      return;
    }

    loadMyItems();
  }, [account]);

  // =====================================
  // LOAD NFT CỦA ACCOUNT
  // =====================================

  const loadMyItems = async () => {
    try {
      setLoading(true);

      if (!window.ethereum) {
        return;
      }

      // =====================================
      // LẤY METADATA TỪ BACKEND
      // =====================================

      const response = await fetch(
        "http://localhost:3000/api/items"
      );

      const items: Item[] =
        await response.json();

      // =====================================
      // KẾT NỐI BLOCKCHAIN
      // =====================================

      const provider =
        new BrowserProvider(
          window.ethereum
        );

      const gameItem =
        new Contract(
          GAME_ITEM_ADDRESS,
          GAME_ITEM_ABI,
          provider
        );

      const marketplace =
        new Contract(
          MARKETPLACE_ADDRESS,
          MARKETPLACE_ABI,
          provider
        );

      // =====================================
      // LOAD TẤT CẢ LISTING CHỈ 1 LẦN
      // =====================================

      const allListings =
        await loadAllListings(
          marketplace
        );

      console.log(
        "All Listings:",
        allListings
      );

      const ownedItems: OwnedItem[] = [];

      // =====================================
      // KIỂM TRA TỪNG NFT
      // =====================================

      for (const item of items) {
        try {
          // =================================
          // KIỂM TRA OWNER THẬT
          // =================================

          const owner =
            await gameItem.ownerOf(
              item.tokenId
            );

          console.log(
            `Token #${item.tokenId}`,
            "Owner:",
            owner
          );

          // NFT không thuộc account hiện tại
          if (
            owner.toLowerCase() !==
            account.toLowerCase()
          ) {
            continue;
          }

          // =================================
          // TÌM LISTING MỚI NHẤT
          // =================================

          const latestListing =
            findLatestListing(
              allListings,
              item.tokenId
            );

          let isForSale = false;

          let blockchainPrice:
            string | undefined;

          let latestListingId:
            number | undefined;

          if (latestListing) {
            latestListingId =
              latestListing.listingId;

            console.log(
              `Token #${item.tokenId}`,
              `Latest Listing #${latestListing.listingId}`,
              `Active: ${latestListing.active}`,
              `Seller: ${latestListing.seller}`
            );

            // =================================
            // ĐANG ĐƯỢC ĐĂNG BÁN
            // =================================

            if (
              latestListing.active &&
              latestListing.seller.toLowerCase() ===
                account.toLowerCase()
            ) {
              isForSale = true;

              blockchainPrice =
                formatEther(
                  latestListing.price
                );
            }

          } else {
            console.log(
              `Token #${item.tokenId}`,
              "No listing"
            );
          }

          // =================================
          // THÊM VÀO MY ITEMS
          // =================================

          ownedItems.push({
            ...item,
            isForSale,
            blockchainPrice,
            latestListingId
          });

        } catch (error) {
          console.error(
            `Token #${item.tokenId} error:`,
            error
          );
        }
      }

      console.log(
        "Owned Items:",
        ownedItems
      );

      setMyItems(ownedItems);

    } catch (error) {
      console.error(
        "Load My Items error:",
        error
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // CANCEL LISTING
  // =====================================

  const cancelListing = async (
    item: OwnedItem
  ) => {
    try {
      if (!window.ethereum) {
        alert(
          "Vui lòng cài MetaMask!"
        );
        return;
      }

      setCancellingId(
        item.id
      );

      const provider =
        new BrowserProvider(
          window.ethereum
        );

      // =====================================
      // KIỂM TRA NETWORK
      // =====================================

      const network =
        await provider.getNetwork();

      if (
        network.chainId !== 31337n
      ) {
        alert(
          "Hãy chuyển MetaMask sang Hardhat Local."
        );
        return;
      }

      // =====================================
      // LẤY SIGNER
      // =====================================

      const signer =
        await provider.getSigner();

      const signerAddress =
        await signer.getAddress();

      // Kiểm tra đúng account
      if (
        signerAddress.toLowerCase() !==
        account.toLowerCase()
      ) {
        alert(
          "Ví MetaMask đã thay đổi."
        );
        return;
      }

      // =====================================
      // MARKETPLACE CONTRACT
      // =====================================

      const marketplace =
        new Contract(
          MARKETPLACE_ADDRESS,
          MARKETPLACE_ABI,
          signer
        );

      // =====================================
      // LOAD LISTING 1 LẦN
      // =====================================

      const allListings =
        await loadAllListings(
          marketplace
        );

      // =====================================
      // TÌM LISTING MỚI NHẤT
      // =====================================

      const latestListing =
        findLatestListing(
          allListings,
          item.tokenId
        );

      if (!latestListing) {
        alert(
          "NFT này chưa từng được đăng bán."
        );

        await loadMyItems();

        return;
      }

      console.log(
        "Cancel latest listing:",
        latestListing
      );

      // =====================================
      // KIỂM TRA ACTIVE
      // =====================================

      if (!latestListing.active) {
        alert(
          "NFT này hiện không được đăng bán."
        );

        await loadMyItems();

        return;
      }

      // =====================================
      // KIỂM TRA SELLER
      // =====================================

      if (
        latestListing.seller.toLowerCase() !==
        account.toLowerCase()
      ) {
        alert(
          "Bạn không phải người đăng bán NFT này."
        );

        return;
      }

      // =====================================
      // CANCEL LISTING
      // =====================================

      const tx =
        await marketplace.cancelListing(
          latestListing.listingId
        );

      console.log(
        "Cancel transaction:",
        tx.hash
      );

      await tx.wait();

      alert(
        `Đã hủy bán ${item.name}!`
      );

      // =====================================
      // LOAD LẠI MY ITEMS
      // =====================================

      await loadMyItems();

    } catch (error) {
      console.error(
        "Cancel listing error:",
        error
      );

      alert(
        "Không thể hủy listing."
      );

    } finally {
      setCancellingId(null);
    }
  };

  // =====================================
  // CHƯA CONNECT WALLET
  // =====================================

  if (!account) {
    return (
      <div className="page-container">

        <h1>
          My Game Items
        </h1>

        <div className="empty-state">

          <div>
            👛
          </div>

          <h2>
            Wallet not connected
          </h2>

          <p>
            Connect MetaMask to view
            your NFTs.
          </p>

        </div>

      </div>
    );
  }

  // =====================================
  // LOADING
  // =====================================

  if (loading) {
    return (
      <div className="page-container">

        <h1>
          My Game Items
        </h1>

        <p>
          Reading blockchain...
        </p>

      </div>
    );
  }

  // =====================================
  // GIAO DIỆN
  // =====================================

  return (
    <div className="page-container">

      <span className="small-title">
        INVENTORY
      </span>

      <h1>
        My Game Items
      </h1>

      <p className="page-description">

        Owned by{" "}

        <strong>
          {account.slice(0, 6)}
          ...
          {account.slice(-4)}
        </strong>

      </p>

      {myItems.length === 0 ? (

        // =================================
        // KHÔNG CÓ NFT
        // =================================

        <div className="empty-state">

          <div>
            🎒
          </div>

          <h2>
            No NFTs owned
          </h2>

          <p>
            Buy an item from the marketplace
            to see it here.
          </p>

        </div>

      ) : (

        // =================================
        // DANH SÁCH NFT
        // =================================

        <div className="market-grid">

          {myItems.map(
            (item) => (

              <div
                className="game-card"
                key={item.id}
              >

                {/* ======================= */}
                {/* IMAGE */}
                {/* ======================= */}

                <div className="image-container">

                  <img
                    src={item.image}
                    alt={item.name}
                  />

                  <span
                    className={`rarity ${
                      (
                        item.rarity ||
                        "Common"
                      ).toLowerCase()
                    }`}
                  >
                    {
                      item.rarity ||
                      "Common"
                    }
                  </span>

                </div>

                {/* ======================= */}
                {/* CONTENT */}
                {/* ======================= */}

                <div className="card-content">

                  <div className="category">
                    {item.category}
                  </div>

                  <h3>
                    {item.name}
                  </h3>

                  <p>
                    {item.description}
                  </p>

                  <div className="token">
                    Token #{item.tokenId}
                  </div>

                  {/* ===================== */}
                  {/* FOR SALE */}
                  {/* ===================== */}

                  {item.isForSale ? (

                    <div className="inventory-status">

                      <div className="for-sale-badge">
                        ● FOR SALE
                      </div>

                      <strong>
                        {item.blockchainPrice} ETH
                      </strong>

                      <div className="token">
                        Listing #
                        {item.latestListingId}
                      </div>

                      <button
                        className="cancel-button"

                        disabled={
                          cancellingId ===
                          item.id
                        }

                        onClick={() =>
                          cancelListing(
                            item
                          )
                        }
                      >

                        {
                          cancellingId ===
                          item.id
                            ? "Cancelling..."
                            : "Cancel Listing"
                        }

                      </button>

                    </div>

                  ) : (

                    // =====================
                    // OWNED - CHƯA BÁN
                    // =====================

                    <div className="inventory-status">

                      <div className="owned-badge">
                        ✓ OWNED
                      </div>

                      <a
                        href="/sell"
                        className="sell-link"
                      >
                        Sell Item
                      </a>

                    </div>

                  )}

                </div>

              </div>

            )
          )}

        </div>

      )}

    </div>
  );
}

export default MyItems;