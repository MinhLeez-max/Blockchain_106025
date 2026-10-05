import {
  useEffect,
  useState
} from "react";

import {
  BrowserProvider,
  Contract,
  formatEther,
  parseEther
} from "ethers";

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

type Props = {
  account: string;
};

type OwnedItem =
  Item & {
    isForSale: boolean;
    blockchainPrice?: string;
    latestListingId?: number;
  };

function translateCategory(
  category: string
) {
  const values:
    Record<string, string> = {
      Weapon: "Vũ khí",
      Armor: "Trang bị",
      Skin: "Skin",
      Other: "Khác"
    };

  return values[category] || category;
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

  return values[rarity] || rarity;
}

function MyItems({
  account
}: Props) {

  const [
    myItems,
    setMyItems
  ] = useState<OwnedItem[]>([]);

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    cancellingId,
    setCancellingId
  ] = useState<number | null>(null);

  const [
    sellingId,
    setSellingId
  ] = useState<number | null>(null);

  const [
    resalePrices,
    setResalePrices
  ] = useState<
    Record<number, string>
  >({});

  // =====================================
  // ACCOUNT THAY ĐỔI
  // =====================================

  useEffect(() => {

    if (!account) {
      setMyItems([]);
      return;
    }

    loadMyItems();

  }, [account]);

  // =====================================
  // LOAD KHO VẬT PHẨM
  // =====================================

  const loadMyItems =
    async () => {

      try {

        setLoading(true);

        if (!window.ethereum) {
          return;
        }

        const response =
          await fetch(
            "http://localhost:3000/api/items"
          );

        if (!response.ok) {
          throw new Error(
            "Không thể tải dữ liệu vật phẩm."
          );
        }

        const items:
          Item[] =
          await response.json();

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

        const allListings =
          await loadAllListings(
            marketplace
          );

        const ownedItems:
          OwnedItem[] = [];

        for (
          const item
          of items
        ) {

          try {

            const owner =
              await gameItem.ownerOf(
                item.tokenId
              );

            if (
              owner.toLowerCase() !==
              account.toLowerCase()
            ) {
              continue;
            }

            const latestListing =
              findLatestListing(
                allListings,
                item.tokenId
              );

            let isForSale =
              false;

            let blockchainPrice:
              string | undefined;

            let latestListingId:
              number | undefined;

            if (latestListing) {

              latestListingId =
                latestListing.listingId;

              if (
                latestListing.active &&
                latestListing.seller
                  .toLowerCase() ===
                account.toLowerCase()
              ) {

                isForSale = true;

                blockchainPrice =
                  formatEther(
                    latestListing.price
                  );
              }
            }

            ownedItems.push({
              ...item,
              isForSale,
              blockchainPrice,
              latestListingId
            });

          } catch (error) {

            console.error(
              `Không đọc được Token #${item.tokenId}:`,
              error
            );

          }
        }

        setMyItems(
          ownedItems
        );

      } catch (error) {

        console.error(
          "Lỗi tải kho vật phẩm:",
          error
        );

      } finally {

        setLoading(false);

      }
    };

  // =====================================
  // BÁN LẠI NFT
  // =====================================

  const resellItem =
    async (
      item: OwnedItem
    ) => {

      try {

        if (!window.ethereum) {
          alert(
            "Vui lòng cài đặt MetaMask."
          );

          return;
        }

        const price =
          resalePrices[
            item.id
          ];

        if (!price) {
          alert(
            "Vui lòng nhập giá bán."
          );

          return;
        }

        const priceNumber =
          Number(price);

        if (
          !Number.isFinite(
            priceNumber
          ) ||
          priceNumber <= 0
        ) {
          alert(
            "Giá bán phải lớn hơn 0."
          );

          return;
        }

        setSellingId(
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
            "Vui lòng chuyển sang mạng Hardhat Local."
          );

          return;
        }

        const signer =
          await provider.getSigner();

        const seller =
          await signer.getAddress();

        // Kiểm tra đúng wallet
        if (
          seller.toLowerCase() !==
          account.toLowerCase()
        ) {
          alert(
            "Tài khoản MetaMask đã thay đổi."
          );

          return;
        }

        const gameItem =
          new Contract(
            GAME_ITEM_ADDRESS,
            GAME_ITEM_ABI,
            signer
          );

        const marketplace =
          new Contract(
            MARKETPLACE_ADDRESS,
            MARKETPLACE_ABI,
            signer
          );

        // =================================
        // KIỂM TRA OWNER
        // =================================

        const owner =
          await gameItem.ownerOf(
            item.tokenId
          );

        if (
          owner.toLowerCase() !==
          seller.toLowerCase()
        ) {
          alert(
            "Bạn không sở hữu NFT này."
          );

          return;
        }

        // =================================
        // KIỂM TRA LISTING
        // =================================

        const allListings =
          await loadAllListings(
            marketplace
          );

        const latestListing =
          findLatestListing(
            allListings,
            item.tokenId
          );

        if (
          latestListing &&
          latestListing.active
        ) {
          alert(
            "Vật phẩm này đang được đăng bán."
          );

          await loadMyItems();

          return;
        }

        // =================================
        // APPROVE
        // =================================

        const approved =
          await gameItem.getApproved(
            item.tokenId
          );

        const approvedForAll =
          await gameItem.isApprovedForAll(
            seller,
            MARKETPLACE_ADDRESS
          );

        if (
          approved.toLowerCase() !==
            MARKETPLACE_ADDRESS
              .toLowerCase() &&
          !approvedForAll
        ) {

          const approveTx =
            await gameItem.approve(
              MARKETPLACE_ADDRESS,
              item.tokenId
            );

          console.log(
            "Approve transaction:",
            approveTx.hash
          );

          await approveTx.wait();
        }

        // =================================
        // LIST LẠI
        // =================================

        const confirmed =
          window.confirm(
            `Đăng bán lại "${item.name}" với giá ${price} ETH?`
          );

        if (!confirmed) {
          return;
        }

        const listTx =
          await marketplace.listItem(
            GAME_ITEM_ADDRESS,
            item.tokenId,
            parseEther(price)
          );

        console.log(
          "Resell transaction:",
          listTx.hash
        );

        await listTx.wait();

        alert(
          `Đã đăng bán lại "${item.name}" với giá ${price} ETH.`
        );

        setResalePrices(
          (current) => ({
            ...current,
            [item.id]: ""
          })
        );

        await loadMyItems();

      } catch (error: any) {

        console.error(
          "Lỗi bán lại:",
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
            "Không thể đăng bán lại vật phẩm."
          );
        }

      } finally {

        setSellingId(null);

      }
    };

  // =====================================
  // HỦY ĐĂNG BÁN
  // =====================================

  const cancelListing =
    async (
      item: OwnedItem
    ) => {

      try {

        if (!window.ethereum) {
          alert(
            "Vui lòng cài đặt MetaMask."
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

        const network =
          await provider.getNetwork();

        if (
          network.chainId !==
          31337n
        ) {
          alert(
            "Vui lòng chuyển sang mạng Hardhat Local."
          );

          return;
        }

        const signer =
          await provider.getSigner();

        const signerAddress =
          await signer.getAddress();

        if (
          signerAddress
            .toLowerCase() !==
          account.toLowerCase()
        ) {
          alert(
            "Tài khoản MetaMask đã thay đổi."
          );

          return;
        }

        const marketplace =
          new Contract(
            MARKETPLACE_ADDRESS,
            MARKETPLACE_ABI,
            signer
          );

        const allListings =
          await loadAllListings(
            marketplace
          );

        const latestListing =
          findLatestListing(
            allListings,
            item.tokenId
          );

        if (!latestListing) {
          alert(
            "Không tìm thấy thông tin đăng bán."
          );

          return;
        }

        if (
          !latestListing.active
        ) {
          alert(
            "Vật phẩm hiện không được đăng bán."
          );

          await loadMyItems();

          return;
        }

        if (
          latestListing.seller
            .toLowerCase() !==
          account.toLowerCase()
        ) {
          alert(
            "Bạn không phải người đăng bán."
          );

          return;
        }

        const confirmed =
          window.confirm(
            `Bạn muốn hủy đăng bán "${item.name}"?`
          );

        if (!confirmed) {
          return;
        }

        const tx =
          await marketplace
            .cancelListing(
              latestListing
                .listingId
            );

        await tx.wait();

        alert(
          `Đã hủy đăng bán "${item.name}".`
        );

        await loadMyItems();

      } catch (error: any) {

        console.error(
          "Lỗi hủy đăng bán:",
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
            "Không thể hủy đăng bán."
          );
        }

      } finally {

        setCancellingId(null);

      }
    };

  // =====================================
  // CHƯA CONNECT
  // =====================================

  if (!account) {
    return (
      <div className="page-container">

        <span className="small-title">
          KHO VẬT PHẨM
        </span>

        <h1>
          Vật phẩm của tôi
        </h1>

        <div className="empty-state">

          <div>👛</div>

          <h2>
            Chưa kết nối ví
          </h2>

          <p>
            Hãy kết nối MetaMask để
            xem NFT bạn đang sở hữu.
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
          Vật phẩm của tôi
        </h1>

        <p>
          Đang đọc dữ liệu blockchain...
        </p>

      </div>
    );
  }

  // =====================================
  // UI
  // =====================================

  return (
    <div className="page-container">

      <span className="small-title">
        KHO VẬT PHẨM
      </span>

      <h1>
        Vật phẩm của tôi
      </h1>

      <p className="page-description">

        Chủ sở hữu:{" "}

        <strong>
          {account.slice(0, 6)}
          ...
          {account.slice(-4)}
        </strong>

      </p>

      {myItems.length === 0 ? (

        <div className="empty-state">

          <div>🎒</div>

          <h2>
            Chưa có vật phẩm
          </h2>

          <p>
            Hãy mua một vật phẩm trên
            Marketplace hoặc tạo NFT mới.
          </p>

        </div>

      ) : (

        <div className="market-grid">

          {myItems.map(
            (item) => (

              <div
                className="game-card"
                key={item.id}
              >

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
                    {translateRarity(
                      item.rarity ||
                      "Common"
                    )}
                  </span>

                </div>

                <div className="card-content">

                  <div className="category">
                    {translateCategory(
                      item.category
                    )}
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

                  {item.isForSale ? (

                    // =====================
                    // ĐANG BÁN
                    // =====================

                    <div className="inventory-status">

                      <div className="for-sale-badge">
                        ● ĐANG BÁN
                      </div>

                      <strong>
                        {item.blockchainPrice}
                        {" "}ETH
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
                        {cancellingId ===
                        item.id
                          ? "Đang hủy..."
                          : "Hủy đăng bán"}
                      </button>

                    </div>

                  ) : (

                    // =====================
                    // ĐANG SỞ HỮU
                    // =====================

                    <div className="inventory-status">

                      <div className="owned-badge">
                        ✓ ĐANG SỞ HỮU
                      </div>

                      <div className="resell-box">

                        <label>
                          Giá bán lại
                        </label>

                        <div className="resell-price-input">

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.50"

                            value={
                              resalePrices[
                                item.id
                              ] || ""
                            }

                            onChange={(e) =>
                              setResalePrices(
                                (
                                  current
                                ) => ({
                                  ...current,

                                  [item.id]:
                                    e.target
                                      .value
                                })
                              )
                            }
                          />

                          <span>
                            ETH
                          </span>

                        </div>

                        <button
                          className="resell-button"

                          disabled={
                            sellingId ===
                            item.id
                          }

                          onClick={() =>
                            resellItem(
                              item
                            )
                          }
                        >
                          {sellingId ===
                          item.id
                            ? "Đang đăng bán..."
                            : "🔄 Đăng bán lại"}
                        </button>

                      </div>

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