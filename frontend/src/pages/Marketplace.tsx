import { useEffect, useState } from "react";
import {
  BrowserProvider,
  Contract
} from "ethers";

import ItemCard, {
  type Item
} from "../components/ItemCard";

import {
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI
} from "../blockchain/contracts";

import {
  loadAllListings,
  findLatestListing
} from "../blockchain/listingHelpers";

function Marketplace() {
  const [items, setItems] =
    useState<Item[]>([]);

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("All");

  const [listingStatus, setListingStatus] =
    useState<Record<number, boolean>>({});

  const [buyingId, setBuyingId] =
    useState<number | null>(null);

  // =====================================
  // LOAD KHI MỞ TRANG
  // =====================================

  useEffect(() => {
    loadItems();
  }, []);

  // =====================================
  // LOAD ITEMS TỪ BACKEND
  // =====================================

  const loadItems = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/items"
      );

      const data: Item[] =
        await response.json();

      setItems(data);

      await loadListings(data);

    } catch (error) {
      console.error(
        "Load items error:",
        error
      );
    }
  };

  // =====================================
  // LOAD TRẠNG THÁI LISTING
  // =====================================

  const loadListings = async (
    data: Item[]
  ) => {
    if (!window.ethereum) {
      return;
    }

    try {
      const provider =
        new BrowserProvider(
          window.ethereum
        );

      const marketplace =
        new Contract(
          MARKETPLACE_ADDRESS,
          MARKETPLACE_ABI,
          provider
        );

      // Đọc toàn bộ listing 1 lần
      const allListings =
        await loadAllListings(
          marketplace
        );

      console.log(
        "Marketplace Listings:",
        allListings
      );

      const status:
        Record<number, boolean> = {};

      // Sau đó chỉ tìm trong array
      for (const item of data) {
        const listing =
          findLatestListing(
            allListings,
            item.tokenId
          );

        if (listing) {
          status[item.id] =
            listing.active;

          console.log(
            `Token #${item.tokenId}`,
            `Listing #${listing.listingId}`,
            `Active: ${listing.active}`,
            `Seller: ${listing.seller}`
          );

        } else {
          status[item.id] = false;

          console.log(
            `Token #${item.tokenId}`,
            "No listing"
          );
        }
      }

      setListingStatus(status);

    } catch (error) {
      console.error(
        "Load listings error:",
        error
      );
    }
  };

  // =====================================
  // BUY ITEM
  // =====================================

  const buyItem = async (
    item: Item
  ) => {
    try {
      // =================================
      // KIỂM TRA METAMASK
      // =================================

      if (!window.ethereum) {
        alert(
          "Vui lòng cài MetaMask!"
        );
        return;
      }

      setBuyingId(item.id);

      const provider =
        new BrowserProvider(
          window.ethereum
        );

      // =================================
      // KIỂM TRA NETWORK
      // =================================

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

      // =================================
      // LẤY BUYER
      // =================================

      const signer =
        await provider.getSigner();

      const buyer =
        await signer.getAddress();

      console.log(
        "Buyer:",
        buyer
      );

      // =================================
      // MARKETPLACE CONTRACT
      // =================================

      const marketplace =
        new Contract(
          MARKETPLACE_ADDRESS,
          MARKETPLACE_ABI,
          signer
        );

      // =================================
      // LOAD LISTINGS
      // =================================

      const allListings =
        await loadAllListings(
          marketplace
        );

      // =================================
      // TÌM LISTING MỚI NHẤT
      // =================================

      const listing =
        findLatestListing(
          allListings,
          item.tokenId
        );

      // Không có listing
      if (!listing) {
        alert(
          "Vật phẩm này chưa được đăng bán."
        );
        return;
      }

      console.log(
        "Latest listing:",
        listing
      );

      // Listing không còn active
      if (!listing.active) {
        alert(
          "Vật phẩm hiện không được bán."
        );

        await loadListings(items);

        return;
      }

      // =================================
      // KHÔNG CHO SELLER TỰ MUA
      // =================================

      if (
        listing.seller.toLowerCase() ===
        buyer.toLowerCase()
      ) {
        alert(
          "Bạn đang là người bán vật phẩm này."
        );
        return;
      }

      console.log(
        `Buying ${item.name}`
      );

      console.log(
        `Token #${item.tokenId}`
      );

      console.log(
        `Listing #${listing.listingId}`
      );

      console.log(
        "Price:",
        listing.price.toString()
      );

      // =================================
      // GỬI GIAO DỊCH BUY
      // =================================

      const tx =
        await marketplace.buyItem(
          listing.listingId,
          {
            value: listing.price
          }
        );

      console.log(
        "Buy transaction:",
        tx.hash
      );

      // Chờ transaction hoàn thành
      await tx.wait();

      alert(
        `Mua ${item.name} thành công!`
      );

      // =================================
      // LOAD LẠI MARKETPLACE
      // =================================

      await loadListings(items);

    } catch (error) {
      console.error(
        "Buy item error:",
        error
      );

      alert(
        "Giao dịch thất bại. Kiểm tra Console."
      );

    } finally {
      setBuyingId(null);
    }
  };

  // =====================================
  // FILTER
  // =====================================

  const filteredItems =
    items.filter((item) => {

      const matchSearch =
        item.name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchCategory =
        category === "All" ||
        item.category === category;

      return (
        matchSearch &&
        matchCategory
      );
    });

  // =====================================
  // UI
  // =====================================

  return (
    <>

      {/* ================================= */}
      {/* HERO */}
      {/* ================================= */}

      <section className="hero">

        <div className="hero-content">

          <div className="hero-badge">
            BLOCKCHAIN GAMING MARKETPLACE
          </div>

          <h1>
            Collect. Trade.
            <br />

            <span>
              Own Your Game.
            </span>
          </h1>

          <p>
            Discover unique weapons,
            armor and skins. Own your
            game items securely on the
            blockchain.
          </p>

          <a href="#marketplace">
            Explore Marketplace
          </a>

        </div>

        <div className="hero-art">
          ⚔️
        </div>

      </section>

      {/* ================================= */}
      {/* MARKETPLACE */}
      {/* ================================= */}

      <section
        className="market-section"
        id="marketplace"
      >

        {/* TITLE */}

        <div className="section-title">

          <div>

            <span className="small-title">
              EXPLORE
            </span>

            <h2>
              Game Marketplace
            </h2>

          </div>

          <div className="item-count">
            {filteredItems.length} ITEMS
          </div>

        </div>

        {/* ================================= */}
        {/* FILTER */}
        {/* ================================= */}

        <div className="filters">

          <input
            type="text"
            placeholder="🔍 Search game items..."
            value={search}

            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

          <div className="categories">

            {[
              "All",
              "Weapon",
              "Armor",
              "Skin"
            ].map(
              (value) => (

                <button
                  key={value}

                  className={
                    category === value
                      ? "active-category"
                      : ""
                  }

                  onClick={() =>
                    setCategory(
                      value
                    )
                  }
                >
                  {value}
                </button>

              )
            )}

          </div>

        </div>

        {/* ================================= */}
        {/* ITEM GRID */}
        {/* ================================= */}

        <div className="market-grid">

          {filteredItems.map(
            (item) => (

              <ItemCard
                key={item.id}

                item={item}

                active={
                  listingStatus[
                    item.id
                  ]
                }

                buying={
                  buyingId ===
                  item.id
                }

                onBuy={() =>
                  buyItem(item)
                }
              />

            )
          )}

        </div>

      </section>

    </>
  );
}

export default Marketplace;