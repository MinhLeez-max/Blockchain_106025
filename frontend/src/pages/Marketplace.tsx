import {
  useEffect,
  useState
} from "react";

import {
  BrowserProvider,
  Contract,
  formatEther
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

type MarketplaceItem =
  Item & {
    active: boolean;
    blockchainPrice?: string;
    blockchainSeller?: string;
  };

function Marketplace() {

  const [
    items,
    setItems
  ] =
    useState<MarketplaceItem[]>(
      []
    );

  const [
    search,
    setSearch
  ] = useState("");

  const [
    category,
    setCategory
  ] = useState("All");

  const [
    buyingId,
    setBuyingId
  ] =
    useState<number | null>(
      null
    );

  const [
    currentAccount,
    setCurrentAccount
  ] = useState("");

  const [
    loading,
    setLoading
  ] = useState(true);

  // =====================================
  // LOAD TRANG
  // =====================================

  useEffect(() => {
    loadMarketplace();
  }, []);

  // =====================================
  // LOAD MARKETPLACE
  // =====================================

  const loadMarketplace =
    async () => {

      try {

        setLoading(true);

        // =================================
        // BACKEND
        // =================================

        const response =
          await fetch(
            "http://localhost:3000/api/items"
          );

        if (!response.ok) {
          throw new Error(
            "Không thể tải dữ liệu vật phẩm."
          );
        }

        const backendItems:
          Item[] =
          await response.json();

        // Chưa có MetaMask
        if (!window.ethereum) {

          const noWalletItems =
            backendItems.map(
              (item) => ({
                ...item,
                active: false
              })
            );

          setItems(
            noWalletItems
          );

          return;
        }

        // =================================
        // BLOCKCHAIN
        // =================================

        const provider =
          new BrowserProvider(
            window.ethereum
          );

        const accounts:
          string[] =
          await provider.send(
            "eth_accounts",
            []
          );

        if (
          accounts.length > 0
        ) {
          setCurrentAccount(
            accounts[0]
          );
        } else {
          setCurrentAccount("");
        }

        const marketplace =
          new Contract(
            MARKETPLACE_ADDRESS,
            MARKETPLACE_ABI,
            provider
          );

        const allListings =
          await loadAllListings(
            marketplace
          );

        // =================================
        // GHÉP BACKEND + BLOCKCHAIN
        // =================================

        const mergedItems:
          MarketplaceItem[] = [];

        for (
          const item
          of backendItems
        ) {

          const listing =
            findLatestListing(
              allListings,
              item.tokenId
            );

          if (!listing) {

            mergedItems.push({
              ...item,
              active: false
            });

            continue;
          }

          mergedItems.push({
            ...item,

            active:
              listing.active,

            price:
              formatEther(
                listing.price
              ),

            blockchainPrice:
              formatEther(
                listing.price
              ),

            blockchainSeller:
              listing.seller,

            seller:
              listing.seller,

            listingId:
              listing.listingId
          });
        }

        setItems(
          mergedItems
        );

      } catch (error) {

        console.error(
          "Lỗi tải Marketplace:",
          error
        );

      } finally {

        setLoading(false);

      }
    };

  // =====================================
  // MUA VẬT PHẨM
  // =====================================

  const buyItem =
    async (
      item: MarketplaceItem
    ) => {

      try {

        if (!window.ethereum) {
          alert(
            "Vui lòng cài đặt MetaMask."
          );

          return;
        }

        setBuyingId(
          item.id
        );

        const provider =
          new BrowserProvider(
            window.ethereum
          );

        const network =
          await provider.getNetwork();

        if (
          network.chainId !==
          31337n
        ) {
          alert(
            "Vui lòng chuyển MetaMask sang mạng Hardhat Local."
          );

          return;
        }

        const signer =
          await provider.getSigner();

        const buyer =
          await signer.getAddress();

        const marketplace =
          new Contract(
            MARKETPLACE_ADDRESS,
            MARKETPLACE_ABI,
            signer
          );

        // Đọc lại blockchain trước khi mua
        const allListings =
          await loadAllListings(
            marketplace
          );

        const listing =
          findLatestListing(
            allListings,
            item.tokenId
          );

        if (!listing) {
          alert(
            "Không tìm thấy thông tin đăng bán."
          );

          return;
        }

        if (!listing.active) {
          alert(
            "Vật phẩm này không còn được bán."
          );

          await loadMarketplace();

          return;
        }

        if (
          listing.seller
            .toLowerCase() ===
          buyer.toLowerCase()
        ) {
          alert(
            "Bạn không thể mua vật phẩm của chính mình."
          );

          return;
        }

        const confirmed =
          window.confirm(
            `Bạn muốn mua "${item.name}" với giá ${formatEther(
              listing.price
            )} ETH?`
          );

        if (!confirmed) {
          return;
        }

        const tx =
          await marketplace.buyItem(
            listing.listingId,
            {
              value:
                listing.price
            }
          );

        console.log(
          "Buy transaction:",
          tx.hash
        );

        await tx.wait();

        alert(
          `Mua "${item.name}" thành công!`
        );

        await loadMarketplace();

      } catch (error: any) {

        console.error(
          "Lỗi mua vật phẩm:",
          error
        );

        if (
          error?.code ===
          "ACTION_REJECTED"
        ) {
          alert(
            "Bạn đã từ chối giao dịch."
          );
        } else {
          alert(
            "Giao dịch thất bại. Vui lòng kiểm tra Console."
          );
        }

      } finally {

        setBuyingId(null);

      }
    };

  // =====================================
  // FILTER
  // =====================================

  const filteredItems =
    items.filter(
      (item) => {

        const matchSearch =
          item.name
            .toLowerCase()
            .includes(
              search
                .toLowerCase()
            );

        const matchCategory =
          category === "All" ||
          item.category ===
            category;

        return (
          matchSearch &&
          matchCategory
        );
      }
    );

  const categoryButtons = [
    {
      value: "All",
      label: "Tất cả"
    },
    {
      value: "Weapon",
      label: "Vũ khí"
    },
    {
      value: "Armor",
      label: "Trang bị"
    },
    {
      value: "Skin",
      label: "Skin"
    },
    {
      value: "Other",
      label: "Khác"
    }
  ];

  // =====================================
  // UI
  // =====================================

  return (
    <>

      <section className="hero">

        <div className="hero-content">

          <div className="hero-badge">
            CHỢ VẬT PHẨM BLOCKCHAIN
          </div>

          <h1>
            Sưu tầm. Giao dịch.
            <br />

            <span>
              Thực sự sở hữu.
            </span>
          </h1>

          <p>
            Tạo, mua và giao dịch các
            vật phẩm game dưới dạng NFT
            một cách minh bạch trên
            blockchain.
          </p>

          <a href="#marketplace">
            Khám phá chợ vật phẩm
          </a>

        </div>

        <div className="hero-art">
          ⚔️
        </div>

      </section>

      <section
        className="market-section"
        id="marketplace"
      >

        <div className="section-title">

          <div>

            <span className="small-title">
              KHÁM PHÁ
            </span>

            <h2>
              Chợ vật phẩm
            </h2>

          </div>

          <div className="item-count">
            {filteredItems.length} VẬT PHẨM
          </div>

        </div>

        <div className="filters">

          <input
            type="text"
            placeholder="🔍 Tìm kiếm vật phẩm..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

          <div className="categories">

            {categoryButtons.map(
              (button) => (

                <button
                  key={
                    button.value
                  }

                  className={
                    category ===
                    button.value
                      ? "active-category"
                      : ""
                  }

                  onClick={() =>
                    setCategory(
                      button.value
                    )
                  }
                >
                  {button.label}
                </button>

              )
            )}

          </div>

        </div>

        {loading ? (

          <div className="empty-state">
            <div>⏳</div>

            <h2>
              Đang tải vật phẩm...
            </h2>
          </div>

        ) : filteredItems.length === 0 ? (

          <div className="empty-state">

            <div>🎮</div>

            <h2>
              Chưa có vật phẩm nào
            </h2>

            <p>
              Hãy kết nối ví và đăng
              vật phẩm đầu tiên lên
              Marketplace.
            </p>

          </div>

        ) : (

          <div className="market-grid">

            {filteredItems.map(
              (item) => {

                const seller =
                  item.blockchainSeller ||
                  item.seller ||
                  "";

                const isSeller =
                  Boolean(
                    currentAccount &&
                    seller &&
                    currentAccount
                      .toLowerCase() ===
                    seller
                      .toLowerCase()
                  );

                return (
                  <ItemCard
                    key={item.id}
                    item={item}
                    active={
                      item.active
                    }
                    buying={
                      buyingId ===
                      item.id
                    }
                    isSeller={
                      isSeller
                    }
                    onBuy={() =>
                      buyItem(item)
                    }
                  />
                );
              }
            )}

          </div>

        )}

      </section>

    </>
  );
}

export default Marketplace;