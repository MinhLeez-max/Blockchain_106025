import {
  useEffect,
  useState
} from "react";

import {
  BrowserProvider,
  Contract,
  formatEther
} from "ethers";

import {
  Link,
  useParams
} from "react-router-dom";

import type {
  Item
} from "../components/ItemCard";

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


type DetailItem =
  Item & {
    owner: string;
    seller: string;
    listingId?: number;
    blockchainPrice?: string;
    isForSale: boolean;
  };


function shortAddress(
  address?: string
) {

  if (!address) {
    return "Không có";
  }

  return (
    address.slice(0, 6) +
    "..." +
    address.slice(-4)
  );
}


function translateCategory(
  category: string
) {

  const values:
    Record<string, string> = {

      Weapon: "Vũ khí",
      Armor: "Trang bị",
      Skin: "Trang phục / Skin",
      Other: "Khác"

    };

  return (
    values[category] ||
    category
  );
}


function translateRarity(
  rarity: string
) {

  const values:
    Record<string, string> = {

      Common: "Thường",
      Rare: "Hiếm",
      Epic: "Sử thi",
      Legendary: "Huyền thoại"

    };

  return (
    values[rarity] ||
    rarity
  );
}


function ItemDetail() {

  const {
    tokenId
  } = useParams();


  const [
    item,
    setItem
  ] =
    useState<
      DetailItem | null
    >(null);


  const [
    account,
    setAccount
  ] = useState("");


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    buying,
    setBuying
  ] = useState(false);


  const [
    error,
    setError
  ] = useState("");


  // =====================================
  // LOAD
  // =====================================

  const loadItem =
    async () => {

      try {

        setLoading(true);
        setError("");

        if (!tokenId) {

          setError(
            "Token ID không hợp lệ."
          );

          return;
        }


        if (!window.ethereum) {

          setError(
            "Vui lòng cài đặt MetaMask."
          );

          return;
        }


        // =================================
        // METADATA BACKEND
        // =================================

        const response =
          await fetch(
            `http://localhost:3000/api/items/token/${tokenId}`
          );


        if (!response.ok) {

          setError(
            `Không tìm thấy Token #${tokenId}.`
          );

          return;
        }


        const metadata:
          Item =
          await response.json();


        // =================================
        // PROVIDER
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

          setAccount(
            accounts[0]
          );

        } else {

          setAccount("");

        }


        // =================================
        // CONTRACTS
        // =================================

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


        // =================================
        // OWNER
        // =================================

        const owner =
          await gameItem.ownerOf(
            metadata.tokenId
          );


        // =================================
        // LISTING
        // =================================

        const listings =
          await loadAllListings(
            marketplace
          );


        const latestListing =
          findLatestListing(
            listings,
            metadata.tokenId
          );


        let seller = "";
        let blockchainPrice:
          string | undefined;

        let listingId:
          number | undefined;

        let isForSale =
          false;


        if (
          latestListing
        ) {

          seller =
            latestListing.seller;

          listingId =
            latestListing.listingId;


          if (
            latestListing.active
          ) {

            isForSale = true;

            blockchainPrice =
              formatEther(
                latestListing.price
              );

          }

        }


        setItem({
          ...metadata,

          owner,

          seller,

          listingId,

          blockchainPrice,

          isForSale
        });


      } catch (error) {

        console.error(
          "Lỗi tải chi tiết NFT:",
          error
        );


        setError(
          "Không thể tải thông tin vật phẩm."
        );


      } finally {

        setLoading(false);

      }

    };


  useEffect(() => {

    loadItem();

  }, [tokenId]);


  // =====================================
  // MUA NFT
  // =====================================

  const buyItem =
    async () => {

      if (!item) {
        return;
      }


      if (
        !item.isForSale ||
        !item.listingId ||
        !item.blockchainPrice
      ) {

        alert(
          "Vật phẩm hiện không được đăng bán."
        );

        return;
      }


      if (!window.ethereum) {

        alert(
          "Vui lòng cài đặt MetaMask."
        );

        return;
      }


      try {

        setBuying(true);


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


        if (
          buyer.toLowerCase() ===
          item.seller.toLowerCase()
        ) {

          alert(
            "Bạn không thể mua vật phẩm của chính mình."
          );

          return;
        }


        const confirmed =
          window.confirm(
            `Bạn muốn mua "${item.name}" với giá ${item.blockchainPrice} ETH?`
          );


        if (!confirmed) {
          return;
        }


        const marketplace =
          new Contract(
            MARKETPLACE_ADDRESS,
            MARKETPLACE_ABI,
            signer
          );


        const listing =
          await marketplace.listings(
            item.listingId
          );


        if (
          !listing.active
        ) {

          alert(
            "Listing này không còn hoạt động."
          );

          await loadItem();

          return;
        }


        const tx =
          await marketplace.buyItem(
            item.listingId,
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


        await loadItem();


      } catch (error: any) {

        console.error(
          "Lỗi mua NFT:",
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
            "Không thể mua vật phẩm."
          );

        }


      } finally {

        setBuying(false);

      }

    };


  // =====================================
  // LOADING
  // =====================================

  if (loading) {

    return (

      <main className="item-detail-page">

        <div className="empty-state">

          <div>
            ⏳
          </div>

          <h2>
            Đang tải NFT...
          </h2>

          <p>
            Đang đọc dữ liệu từ blockchain.
          </p>

        </div>

      </main>

    );

  }


  // =====================================
  // ERROR
  // =====================================

  if (
    error ||
    !item
  ) {

    return (

      <main className="item-detail-page">

        <div className="empty-state">

          <div>
            ❌
          </div>

          <h2>
            Không tìm thấy vật phẩm
          </h2>

          <p>
            {error}
          </p>

          <Link
            to="/"
            className="detail-back-button"
          >
            ← Quay lại Marketplace
          </Link>

        </div>

      </main>

    );

  }


  // =====================================
  // CHECK OWNER
  // =====================================

  const isOwner =
    account &&
    item.owner.toLowerCase() ===
      account.toLowerCase();


  // =====================================
  // UI
  // =====================================

  return (

    <main className="item-detail-page">

      <Link
        to="/"
        className="detail-back-link"
      >
        ← Quay lại Chợ vật phẩm
      </Link>


      <div className="item-detail-layout">


        {/* ============================== */}
        {/* IMAGE */}
        {/* ============================== */}

        <div className="detail-image-panel">

          <img
            src={item.image}
            alt={item.name}
          />

        </div>


        {/* ============================== */}
        {/* INFORMATION */}
        {/* ============================== */}

        <div className="detail-info-panel">


          <div className="detail-top-labels">

            <span className="detail-category">

              {translateCategory(
                item.category
              )}

            </span>


            <span
              className={`detail-rarity ${
                (
                  item.rarity ||
                  "Common"
                ).toLowerCase()
              }`}
            >

              {translateRarity(
                item.rarity ||
                "Common"
              )}

            </span>

          </div>


          <h1>
            {item.name}
          </h1>


          <p className="detail-description">
            {item.description}
          </p>


          {/* ========================== */}
          {/* PRICE */}
          {/* ========================== */}

          <div className="detail-price-box">

            <span>
              GIÁ HIỆN TẠI
            </span>


            {item.isForSale ? (

              <strong>
                {item.blockchainPrice}
                {" "}ETH
              </strong>

            ) : (

              <strong className="not-for-sale">
                Không đăng bán
              </strong>

            )}

          </div>


          {/* ========================== */}
          {/* BLOCKCHAIN INFO */}
          {/* ========================== */}

          <div className="blockchain-info">

            <h3>
              Thông tin Blockchain
            </h3>


            <div className="blockchain-row">

              <span>
                Token ID
              </span>

              <strong>
                #{item.tokenId}
              </strong>

            </div>


            {item.listingId && (

              <div className="blockchain-row">

                <span>
                  Listing ID
                </span>

                <strong>
                  #{item.listingId}
                </strong>

              </div>

            )}


            <div className="blockchain-row">

              <span>
                Chủ sở hữu
              </span>

              <strong
                title={item.owner}
              >
                {shortAddress(
                  item.owner
                )}
              </strong>

            </div>


            {item.seller && (

              <div className="blockchain-row">

                <span>
                  Người đăng bán
                </span>

                <strong
                  title={
                    item.seller
                  }
                >
                  {shortAddress(
                    item.seller
                  )}
                </strong>

              </div>

            )}


            <div className="blockchain-row">

              <span>
                NFT Contract
              </span>

              <strong
                title={
                  GAME_ITEM_ADDRESS
                }
              >
                {shortAddress(
                  GAME_ITEM_ADDRESS
                )}
              </strong>

            </div>


            <div className="blockchain-row">

              <span>
                Marketplace
              </span>

              <strong
                title={
                  MARKETPLACE_ADDRESS
                }
              >
                {shortAddress(
                  MARKETPLACE_ADDRESS
                )}
              </strong>

            </div>


            <div className="blockchain-row">

              <span>
                Mạng
              </span>

              <strong>
                Hardhat Local
              </strong>

            </div>

          </div>


          {/* ========================== */}
          {/* ACTION */}
          {/* ========================== */}

          <div className="detail-action">


            {isOwner ? (

              <>

                <div className="detail-owner-message">

                  ✓ Bạn đang sở hữu NFT này

                </div>


                <Link
                  to="/my-items"
                  className="detail-inventory-button"
                >
                  Mở Kho của tôi
                </Link>

              </>

            ) : item.isForSale ? (

              <button
                className="detail-buy-button"

                disabled={
                  buying
                }

                onClick={
                  buyItem
                }
              >

                {buying
                  ? "Đang xử lý giao dịch..."
                  : `🛒 Mua ngay - ${item.blockchainPrice} ETH`
                }

              </button>

            ) : (

              <button
                className="detail-disabled-button"
                disabled
              >
                Vật phẩm hiện không được bán
              </button>

            )}


          </div>


        </div>

      </div>

    </main>

  );

}


export default ItemDetail;