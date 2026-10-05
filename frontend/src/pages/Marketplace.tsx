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

import TransactionModal
  from "../components/TransactionModal";

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


type ModalType =
  | "confirm"
  | "loading"
  | "success"
  | "error";


type ModalState = {
  open: boolean;
  type: ModalType;
  title: string;
  message: string;
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


  const [
    pendingItem,
    setPendingItem
  ] =
    useState<MarketplaceItem | null>(
      null
    );


  const [
    modal,
    setModal
  ] =
    useState<ModalState>({
      open: false,
      type: "confirm",
      title: "",
      message: ""
    });


  // =====================================
  // MODAL HELPER
  // =====================================

  const showModal = (
    type: ModalType,
    title: string,
    message: string
  ) => {

    setModal({
      open: true,
      type,
      title,
      message
    });

  };


  const closeModal =
    () => {

      if (
        modal.type === "loading"
      ) {
        return;
      }

      setModal(
        (current) => ({
          ...current,
          open: false
        })
      );

      setPendingItem(null);

    };


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


        // =================================
        // CHƯA CÓ METAMASK
        // =================================

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
        // BACKEND + BLOCKCHAIN
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
  // YÊU CẦU MUA
  // =====================================

  const requestBuy =
    async (
      item: MarketplaceItem
    ) => {

      if (!window.ethereum) {

        showModal(
          "error",
          "Chưa có MetaMask",
          "Vui lòng cài đặt MetaMask để thực hiện giao dịch."
        );

        return;

      }


      try {

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

          showModal(
            "error",
            "Sai mạng blockchain",
            "Vui lòng chuyển MetaMask sang mạng Hardhat Local (Chain ID 31337)."
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


        // Đọc lại blockchain
        // trước khi hiển thị xác nhận.

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

          showModal(
            "error",
            "Không tìm thấy listing",
            "Không tìm thấy thông tin đăng bán của vật phẩm này."
          );

          return;

        }


        if (!listing.active) {

          showModal(
            "error",
            "Vật phẩm không còn bán",
            "Listing này đã được mua hoặc đã bị hủy."
          );


          await loadMarketplace();

          return;

        }


        if (
          listing.seller
            .toLowerCase() ===
          buyer.toLowerCase()
        ) {

          showModal(
            "error",
            "Không thể mua",
            "Bạn không thể mua vật phẩm của chính mình."
          );

          return;

        }


        setPendingItem({
          ...item,

          listingId:
            listing.listingId,

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

          active:
            listing.active
        });


        showModal(
          "confirm",
          "Xác nhận mua NFT",
          `Bạn muốn mua "${item.name}" với giá ${formatEther(
            listing.price
          )} ETH?`
        );


      } catch (error) {

        console.error(
          "Lỗi kiểm tra giao dịch:",
          error
        );


        showModal(
          "error",
          "Không thể kiểm tra giao dịch",
          "Đã xảy ra lỗi khi đọc dữ liệu blockchain."
        );

      }

    };


  // =====================================
  // XÁC NHẬN MUA
  // =====================================

  const confirmBuy =
    async () => {

      if (
        !pendingItem ||
        !window.ethereum
      ) {
        return;
      }


      try {

        setBuyingId(
          pendingItem.id
        );


        showModal(
          "loading",
          "Đang chờ MetaMask",
          "Vui lòng xác nhận giao dịch mua NFT trong MetaMask."
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

          showModal(
            "error",
            "Sai mạng blockchain",
            "Vui lòng chuyển MetaMask sang Hardhat Local (Chain ID 31337)."
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


        // =================================
        // KIỂM TRA LẠI LẦN CUỐI
        // =================================

        const allListings =
          await loadAllListings(
            marketplace
          );


        const listing =
          findLatestListing(
            allListings,
            pendingItem.tokenId
          );


        if (
          !listing ||
          !listing.active
        ) {

          showModal(
            "error",
            "Giao dịch không thể thực hiện",
            "Vật phẩm này không còn được đăng bán."
          );


          await loadMarketplace();

          return;

        }


        if (
          listing.seller
            .toLowerCase() ===
          buyer.toLowerCase()
        ) {

          showModal(
            "error",
            "Không thể mua",
            "Bạn không thể mua vật phẩm của chính mình."
          );

          return;

        }


        // =================================
        // SEND TRANSACTION
        // =================================

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


        showModal(
          "loading",
          "Đang xử lý giao dịch",
          "Giao dịch đã được gửi. Đang chờ blockchain xác nhận..."
        );


        await tx.wait();


        // =================================
        // SUCCESS
        // =================================

        showModal(
          "success",
          "Mua NFT thành công!",
          `Bạn đã mua "${pendingItem.name}" với giá ${formatEther(
            listing.price
          )} ETH. Token #${pendingItem.tokenId} hiện thuộc sở hữu của bạn.`
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

          showModal(
            "error",
            "Đã hủy giao dịch",
            "Bạn đã từ chối giao dịch trong MetaMask."
          );

        } else {

          showModal(
            "error",
            "Giao dịch thất bại",
            "Không thể hoàn tất giao dịch. Vui lòng kiểm tra ví MetaMask và Console."
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

      {/* ================================= */}
{/* HERO V2 */}
{/* ================================= */}

<section className="hero hero-v2">

  {/* BACKGROUND EFFECTS */}

  <div className="hero-grid"></div>

  <div className="hero-glow hero-glow-one"></div>
  <div className="hero-glow hero-glow-two"></div>

  <div className="hero-particle particle-one"></div>
  <div className="hero-particle particle-two"></div>
  <div className="hero-particle particle-three"></div>
  <div className="hero-particle particle-four"></div>


  {/* ================================= */}
  {/* LEFT CONTENT */}
  {/* ================================= */}

  <div className="hero-content hero-content-v2">

    <div className="hero-badge hero-badge-v2">

      <span className="hero-badge-dot"></span>

      CHỢ VẬT PHẨM BLOCKCHAIN

    </div>


    <h1 className="hero-title-v2">

      <span className="hero-title-white">
        Sưu tầm. Giao dịch.
      </span>

      <br />

      <span className="hero-gradient-text">
        Thực sự sở hữu.
      </span>

    </h1>


    <p className="hero-description-v2">

      Tạo, mua và giao dịch các vật phẩm
      game dưới dạng NFT một cách minh bạch,
      an toàn và xác minh trực tiếp trên
      blockchain.

    </p>


    {/* BUTTONS */}

    <div className="hero-actions">

      <a
        href="#marketplace"
        className="hero-primary-button"
      >

        <span>
          Khám phá Marketplace
        </span>

        <span className="hero-button-arrow">
          →
        </span>

      </a>


      <a
        href="/sell"
        className="hero-secondary-button"
      >

        <span>
          ＋
        </span>

        Tạo NFT

      </a>

    </div>


    {/* FEATURES */}

    <div className="hero-features">

      <div className="hero-feature">

        <div className="hero-feature-icon">
          ◈
        </div>

        <div>
          <strong>
            ERC-721
          </strong>

          <span>
            NFT Standard
          </span>
        </div>

      </div>


      <div className="hero-feature">

        <div className="hero-feature-icon">
          ◉
        </div>

        <div>
          <strong>
            Blockchain
          </strong>

          <span>
            Minh bạch
          </span>
        </div>

      </div>


      <div className="hero-feature">

        <div className="hero-feature-icon">
          ◆
        </div>

        <div>
          <strong>
            MetaMask
          </strong>

          <span>
            Giao dịch an toàn
          </span>
        </div>

      </div>

    </div>

  </div>


  {/* ================================= */}
  {/* RIGHT ART */}
  {/* ================================= */}

  <div className="hero-visual">

    <div className="hero-visual-glow"></div>


    <div className="hero-orbit orbit-one"></div>

    <div className="hero-orbit orbit-two"></div>


    <div className="hero-orbit-dot orbit-dot-one"></div>

    <div className="hero-orbit-dot orbit-dot-two"></div>


    <div className="hero-sword-card">

      <div className="hero-card-shine"></div>


      <div className="hero-art hero-art-v2">
        ⚔️
      </div>


      <div className="hero-art-label">

        <span className="hero-live-dot"></span>

        NFT MARKETPLACE

      </div>

    </div>


    <div className="hero-floating-card hero-floating-top">

      <span>
        ◈
      </span>

      <div>
        <small>
          CHUẨN NFT
        </small>

        <strong>
          ERC-721
        </strong>
      </div>

    </div>


    <div className="hero-floating-card hero-floating-bottom">

      <span>
        ✓
      </span>

      <div>
        <small>
          QUYỀN SỞ HỮU
        </small>

        <strong>
          On-chain
        </strong>
      </div>

    </div>

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

            {filteredItems.length}
            {" "}
            VẬT PHẨM

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

            <div>
              ⏳
            </div>

            <h2>
              Đang tải vật phẩm...
            </h2>

          </div>

        ) : filteredItems.length ===
          0 ? (

          <div className="empty-state">

            <div>
              🎮
            </div>

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
                      requestBuy(
                        item
                      )
                    }
                  />

                );

              }
            )}

          </div>

        )}

      </section>


      {/* ================================= */}
      {/* TRANSACTION MODAL */}
      {/* ================================= */}

      <TransactionModal
        open={
          modal.open
        }
        type={
          modal.type
        }
        title={
          modal.title
        }
        message={
          modal.message
        }
        confirmText="Xác nhận mua"
        cancelText="Hủy"
        onConfirm={
          confirmBuy
        }
        onClose={
          closeModal
        }
      />

    </>

  );

}


export default Marketplace;