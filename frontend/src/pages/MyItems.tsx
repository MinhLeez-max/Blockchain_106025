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

import TransactionModal
  from "../components/TransactionModal";

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


type ModalType =
  | "confirm"
  | "loading"
  | "success"
  | "error";


type ModalAction =
  | "resell"
  | "cancel"
  | null;


type ModalState = {
  open: boolean;
  type: ModalType;
  title: string;
  message: string;
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


function MyItems({
  account
}: Props) {

  const [
    myItems,
    setMyItems
  ] =
    useState<OwnedItem[]>(
      []
    );


  const [
    loading,
    setLoading
  ] =
    useState(false);


  const [
    cancellingId,
    setCancellingId
  ] =
    useState<number | null>(
      null
    );


  const [
    sellingId,
    setSellingId
  ] =
    useState<number | null>(
      null
    );


  const [
    resalePrices,
    setResalePrices
  ] =
    useState<
      Record<number, string>
    >({});


  const [
    selectedItem,
    setSelectedItem
  ] =
    useState<OwnedItem | null>(
      null
    );


  const [
    modalAction,
    setModalAction
  ] =
    useState<ModalAction>(
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
  // MODAL
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
        modal.type ===
        "loading"
      ) {
        return;
      }


      setModal(
        (current) => ({
          ...current,
          open: false
        })
      );


      setSelectedItem(
        null
      );


      setModalAction(
        null
      );

    };


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

        setLoading(
          true
        );


        if (
          !window.ethereum
        ) {
          return;
        }


        const response =
          await fetch(
            "http://localhost:3000/api/items"
          );


        if (
          !response.ok
        ) {

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
              owner
                .toLowerCase() !==
              account
                .toLowerCase()
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


            if (
              latestListing
            ) {

              latestListingId =
                latestListing
                  .listingId;


              if (
                latestListing.active &&
                latestListing.seller
                  .toLowerCase() ===
                account
                  .toLowerCase()
              ) {

                isForSale =
                  true;


                blockchainPrice =
                  formatEther(
                    latestListing
                      .price
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

        setLoading(
          false
        );

      }

    };


  // =====================================
  // YÊU CẦU BÁN LẠI
  // =====================================

  const requestResell =
    (
      item: OwnedItem
    ) => {

      if (
        !window.ethereum
      ) {

        showModal(
          "error",
          "Chưa có MetaMask",
          "Vui lòng cài đặt MetaMask để đăng bán NFT."
        );

        return;

      }


      const price =
        resalePrices[
          item.id
        ];


      if (!price) {

        showModal(
          "error",
          "Chưa nhập giá bán",
          "Vui lòng nhập giá bạn muốn bán lại NFT."
        );

        return;

      }


      const priceNumber =
        Number(
          price
        );


      if (
        !Number.isFinite(
          priceNumber
        ) ||
        priceNumber <= 0
      ) {

        showModal(
          "error",
          "Giá không hợp lệ",
          "Giá bán lại phải lớn hơn 0 ETH."
        );

        return;

      }


      setSelectedItem(
        item
      );


      setModalAction(
        "resell"
      );


      showModal(
        "confirm",
        "Xác nhận đăng bán lại",
        `Bạn muốn đăng bán lại "${item.name}" với giá ${price} ETH?`
      );

    };


  // =====================================
  // THỰC HIỆN BÁN LẠI
  // =====================================

  const executeResell =
    async () => {

      if (
        !selectedItem ||
        !window.ethereum
      ) {
        return;
      }


      const item =
        selectedItem;


      const price =
        resalePrices[
          item.id
        ];


      if (!price) {
        return;
      }


      try {

        setSellingId(
          item.id
        );


        // =================================
        // KIỂM TRA VÍ
        // =================================

        showModal(
          "loading",
          "Đang kiểm tra ví",
          "Đang kiểm tra tài khoản MetaMask và quyền sở hữu NFT..."
        );


        const provider =
          new BrowserProvider(
            window.ethereum
          );


        const network =
          await provider
            .getNetwork();


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
          await provider
            .getSigner();


        const seller =
          await signer
            .getAddress();


        if (
          seller
            .toLowerCase() !==
          account
            .toLowerCase()
        ) {

          showModal(
            "error",
            "Sai tài khoản MetaMask",
            "Tài khoản MetaMask hiện tại không trùng với tài khoản đang mở Kho vật phẩm."
          );

          return;

        }


        // =================================
        // CONTRACTS
        // =================================

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
          await gameItem
            .ownerOf(
              item.tokenId
            );


        if (
          owner
            .toLowerCase() !==
          seller
            .toLowerCase()
        ) {

          showModal(
            "error",
            "Không phải chủ sở hữu",
            "Ví hiện tại không còn sở hữu NFT này."
          );

          await loadMyItems();

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

          showModal(
            "error",
            "NFT đang được bán",
            "Vật phẩm này đã có một listing đang hoạt động."
          );


          await loadMyItems();

          return;

        }


        // =================================
        // KIỂM TRA APPROVE
        // =================================

        const approved =
          await gameItem
            .getApproved(
              item.tokenId
            );


        const approvedForAll =
          await gameItem
            .isApprovedForAll(
              seller,
              MARKETPLACE_ADDRESS
            );


        if (
          approved
            .toLowerCase() !==
            MARKETPLACE_ADDRESS
              .toLowerCase() &&
          !approvedForAll
        ) {

          showModal(
            "loading",
            "1/2 - Cấp quyền Marketplace",
            `Vui lòng xác nhận Approve cho Token #${item.tokenId} trong MetaMask.`
          );


          const approveTx =
            await gameItem
              .approve(
                MARKETPLACE_ADDRESS,
                item.tokenId
              );


          console.log(
            "Approve transaction:",
            approveTx.hash
          );


          showModal(
            "loading",
            "1/2 - Cấp quyền Marketplace",
            "Giao dịch Approve đã được gửi. Đang chờ blockchain xác nhận..."
          );


          await approveTx.wait();

        }


        // =================================
        // LIST LẠI
        // =================================

        showModal(
          "loading",
          approvedForAll ||
          approved
            .toLowerCase() ===
            MARKETPLACE_ADDRESS
              .toLowerCase()
            ? "Đang đăng bán lại"
            : "2/2 - Đăng bán lại",
          `Vui lòng xác nhận đăng bán "${item.name}" với giá ${price} ETH trong MetaMask.`
        );


        const listTx =
          await marketplace
            .listItem(
              GAME_ITEM_ADDRESS,
              item.tokenId,
              parseEther(
                price
              )
            );


        console.log(
          "Resell transaction:",
          listTx.hash
        );


        showModal(
          "loading",
          "Đang xác nhận giao dịch",
          "Giao dịch đăng bán đã được gửi. Đang chờ blockchain xác nhận..."
        );


        await listTx.wait();


        // =================================
        // SUCCESS
        // =================================

        showModal(
          "success",
          "Đăng bán lại thành công!",
          `"${item.name}" đã được đăng bán với giá ${price} ETH. Token #${item.tokenId}.`
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

          showModal(
            "error",
            "Đã hủy giao dịch",
            "Bạn đã từ chối giao dịch trong MetaMask."
          );

        } else {

          showModal(
            "error",
            "Đăng bán lại thất bại",
            error?.shortMessage ||
            error?.reason ||
            "Không thể đăng bán lại vật phẩm."
          );

        }


      } finally {

        setSellingId(
          null
        );

      }

    };


  // =====================================
  // YÊU CẦU HỦY BÁN
  // =====================================

  const requestCancel =
    (
      item: OwnedItem
    ) => {

      if (
        !window.ethereum
      ) {

        showModal(
          "error",
          "Chưa có MetaMask",
          "Vui lòng cài đặt MetaMask để thực hiện giao dịch."
        );

        return;

      }


      setSelectedItem(
        item
      );


      setModalAction(
        "cancel"
      );


      showModal(
        "confirm",
        "Xác nhận hủy đăng bán",
        `Bạn có chắc muốn hủy đăng bán "${item.name}"? NFT sẽ vẫn nằm trong ví của bạn.`
      );

    };


  // =====================================
  // THỰC HIỆN HỦY BÁN
  // =====================================

  const executeCancel =
    async () => {

      if (
        !selectedItem ||
        !window.ethereum
      ) {
        return;
      }


      const item =
        selectedItem;


      try {

        setCancellingId(
          item.id
        );


        showModal(
          "loading",
          "Đang kiểm tra listing",
          "Đang kiểm tra thông tin đăng bán trên blockchain..."
        );


        const provider =
          new BrowserProvider(
            window.ethereum
          );


        const network =
          await provider
            .getNetwork();


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
          await provider
            .getSigner();


        const signerAddress =
          await signer
            .getAddress();


        if (
          signerAddress
            .toLowerCase() !==
          account
            .toLowerCase()
        ) {

          showModal(
            "error",
            "Sai tài khoản MetaMask",
            "Tài khoản MetaMask hiện tại không trùng với tài khoản đang mở Kho vật phẩm."
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


        if (
          !latestListing
        ) {

          showModal(
            "error",
            "Không tìm thấy listing",
            "Không tìm thấy thông tin đăng bán của NFT này."
          );

          return;

        }


        if (
          !latestListing.active
        ) {

          showModal(
            "error",
            "Listing không hoạt động",
            "Vật phẩm hiện không còn được đăng bán."
          );


          await loadMyItems();

          return;

        }


        if (
          latestListing.seller
            .toLowerCase() !==
          account
            .toLowerCase()
        ) {

          showModal(
            "error",
            "Không có quyền hủy",
            "Bạn không phải người tạo listing này."
          );

          return;

        }


        // =================================
        // CANCEL
        // =================================

        showModal(
          "loading",
          "Đang hủy đăng bán",
          `Vui lòng xác nhận hủy Listing #${latestListing.listingId} trong MetaMask.`
        );


        const tx =
          await marketplace
            .cancelListing(
              latestListing
                .listingId
            );


        console.log(
          "Cancel transaction:",
          tx.hash
        );


        showModal(
          "loading",
          "Đang xác nhận giao dịch",
          "Yêu cầu hủy đã được gửi. Đang chờ blockchain xác nhận..."
        );


        await tx.wait();


        // =================================
        // SUCCESS
        // =================================

        showModal(
          "success",
          "Đã hủy đăng bán!",
          `"${item.name}" đã được gỡ khỏi Marketplace. NFT vẫn thuộc sở hữu của bạn.`
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

          showModal(
            "error",
            "Đã hủy giao dịch",
            "Bạn đã từ chối giao dịch trong MetaMask."
          );

        } else {

          showModal(
            "error",
            "Hủy đăng bán thất bại",
            error?.shortMessage ||
            error?.reason ||
            "Không thể hủy đăng bán."
          );

        }


      } finally {

        setCancellingId(
          null
        );

      }

    };


  // =====================================
  // XỬ LÝ NÚT XÁC NHẬN MODAL
  // =====================================

  const handleModalConfirm =
    () => {

      if (
        modalAction ===
        "resell"
      ) {

        executeResell();

        return;

      }


      if (
        modalAction ===
        "cancel"
      ) {

        executeCancel();

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

          <div>
            👛
          </div>


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

          {account.slice(
            0,
            6
          )}

          ...

          {account.slice(
            -4
          )}

        </strong>

      </p>


      {myItems.length ===
      0 ? (

        <div className="empty-state">

          <div>
            🎒
          </div>


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
                key={
                  item.id
                }
              >


                {/* ===================== */}
                {/* IMAGE */}
                {/* ===================== */}

                <div className="image-container">

                  <img
                    src={
                      item.image
                    }
                    alt={
                      item.name
                    }
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


                {/* ===================== */}
                {/* CONTENT */}
                {/* ===================== */}

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

                    Token #
                    {item.tokenId}

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

                        {" "}

                        ETH

                      </strong>


                      <div className="token">

                        Listing #

                        {item.latestListingId}

                      </div>


                      <button
                        className="cancel-button"
                        disabled={
                          cancellingId ===
                          item.id ||
                          sellingId !== null
                        }
                        onClick={() =>
                          requestCancel(
                            item
                          )
                        }
                      >

                        {cancellingId ===
                        item.id
                          ? "Đang hủy..."
                          : "Hủy đăng bán"
                        }

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
                            disabled={
                              sellingId ===
                              item.id
                            }
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
                            item.id ||
                            cancellingId !==
                              null
                          }
                          onClick={() =>
                            requestResell(
                              item
                            )
                          }
                        >

                          {sellingId ===
                          item.id
                            ? "Đang đăng bán..."
                            : "🔄 Đăng bán lại"
                          }

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
        confirmText={
          modalAction ===
          "cancel"
            ? "Xác nhận hủy"
            : "Đăng bán"
        }
        cancelText="Quay lại"
        onConfirm={
          handleModalConfirm
        }
        onClose={
          closeModal
        }
      />


    </div>

  );

}


export default MyItems;