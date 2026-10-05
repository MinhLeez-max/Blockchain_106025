import {
  useState
} from "react";

import {
  BrowserProvider,
  Contract,
  parseEther
} from "ethers";

import TransactionModal
  from "../components/TransactionModal";

import {
  GAME_ITEM_ADDRESS,
  GAME_ITEM_ABI,
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI
} from "../blockchain/contracts";


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


function SellItem() {

  const [
    name,
    setName
  ] = useState("");


  const [
    description,
    setDescription
  ] = useState("");


  const [
    category,
    setCategory
  ] = useState("Weapon");


  const [
    rarity,
    setRarity
  ] = useState("Common");


  const [
    price,
    setPrice
  ] = useState("");


  const [
    image,
    setImage
  ] =
    useState<File | null>(
      null
    );


  const [
    preview,
    setPreview
  ] = useState("");


  const [
    loading,
    setLoading
  ] = useState(false);


  const [
    status,
    setStatus
  ] = useState("");


  const [
    modal,
    setModal
  ] =
    useState<ModalState>({
      open: false,
      type: "loading",
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

    };


  // =====================================
  // CHỌN ẢNH
  // =====================================

  const handleImageChange = (
    event:
      React.ChangeEvent<HTMLInputElement>
  ) => {

    const file =
      event.target.files?.[0];


    if (!file) {
      return;
    }


    // =================================
    // KIỂM TRA DUNG LƯỢNG
    // =================================

    if (
      file.size >
      5 * 1024 * 1024
    ) {

      showModal(
        "error",
        "Ảnh quá lớn",
        "Hình ảnh không được vượt quá 5 MB."
      );

      return;

    }


    // =================================
    // KIỂM TRA ĐỊNH DẠNG
    // =================================

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];


    if (
      !allowedTypes.includes(
        file.type
      )
    ) {

      showModal(
        "error",
        "Định dạng không hợp lệ",
        "Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP."
      );

      return;

    }


    setImage(
      file
    );


    const previewUrl =
      URL.createObjectURL(
        file
      );


    setPreview(
      previewUrl
    );

  };


  // =====================================
  // RESET FORM
  // =====================================

  const resetForm =
    () => {

      setName("");

      setDescription("");

      setCategory(
        "Weapon"
      );

      setRarity(
        "Common"
      );

      setPrice("");

      setImage(
        null
      );

      setPreview("");

    };


  // =====================================
  // TẠO NFT + ĐĂNG BÁN
  // =====================================

  const createAndSell =
    async () => {

      // =================================
      // VALIDATE
      // =================================

      if (!window.ethereum) {

        showModal(
          "error",
          "Chưa có MetaMask",
          "Vui lòng cài đặt MetaMask để tạo và đăng bán NFT."
        );

        return;

      }


      if (
        !name.trim() ||
        !description.trim() ||
        !price ||
        !image
      ) {

        showModal(
          "error",
          "Thiếu thông tin",
          "Vui lòng nhập đầy đủ thông tin vật phẩm và chọn hình ảnh."
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
          "Giá bán không hợp lệ",
          "Giá bán NFT phải lớn hơn 0 ETH."
        );

        return;

      }


      try {

        setLoading(
          true
        );


        // =================================
        // CONNECT WALLET
        // =================================

        setStatus(
          "Đang kết nối ví..."
        );


        showModal(
          "loading",
          "Đang kiểm tra ví",
          "Đang kết nối với MetaMask và kiểm tra mạng blockchain..."
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
        // TOKEN ID
        // =================================

        const tokenIdBefore =
          await gameItem
            .nextTokenId();


        const tokenId =
          Number(
            tokenIdBefore
          );


        console.log(
          "Token ID mới:",
          tokenId
        );


        const tokenURI =
          `gameitem://${tokenId}`;


        // =================================
        // BƯỚC 1: MINT
        // =================================

        setStatus(
          "1/4 - Đang tạo NFT..."
        );


        showModal(
          "loading",
          "1/4 - Đang tạo NFT",
          `Đang tạo NFT cho "${name}". Vui lòng xác nhận giao dịch Mint trong MetaMask.`
        );


        const mintTx =
          await gameItem
            .mintItem(
              tokenURI
            );


        console.log(
          "Mint TX:",
          mintTx.hash
        );


        showModal(
          "loading",
          "1/4 - Đang tạo NFT",
          "Giao dịch Mint đã được gửi. Đang chờ blockchain xác nhận..."
        );


        await mintTx.wait();


        // =================================
        // BƯỚC 2: APPROVE
        // =================================

        setStatus(
          "2/4 - Đang cấp quyền cho Marketplace..."
        );


        showModal(
          "loading",
          "2/4 - Cấp quyền Marketplace",
          "NFT đã được tạo. Vui lòng xác nhận giao dịch Approve trong MetaMask."
        );


        const approveTx =
          await gameItem
            .approve(
              MARKETPLACE_ADDRESS,
              tokenId
            );


        console.log(
          "Approve TX:",
          approveTx.hash
        );


        showModal(
          "loading",
          "2/4 - Cấp quyền Marketplace",
          "Giao dịch Approve đã được gửi. Đang chờ blockchain xác nhận..."
        );


        await approveTx.wait();


        // =================================
        // BƯỚC 3: LIST
        // =================================

        setStatus(
          "3/4 - Đang đăng bán vật phẩm..."
        );


        showModal(
          "loading",
          "3/4 - Đăng bán NFT",
          `Vui lòng xác nhận đăng bán "${name}" với giá ${price} ETH trong MetaMask.`
        );


        const listTx =
          await marketplace
            .listItem(
              GAME_ITEM_ADDRESS,
              tokenId,
              parseEther(
                price
              )
            );


        console.log(
          "List TX:",
          listTx.hash
        );


        showModal(
          "loading",
          "3/4 - Đăng bán NFT",
          "Giao dịch đăng bán đã được gửi. Đang chờ blockchain xác nhận..."
        );


        await listTx.wait();


        // =================================
        // BƯỚC 4: BACKEND
        // =================================

        setStatus(
          "4/4 - Đang lưu thông tin vật phẩm..."
        );


        showModal(
          "loading",
          "4/4 - Lưu thông tin",
          "Blockchain đã xác nhận. Đang tải hình ảnh và lưu metadata vật phẩm..."
        );


        const formData =
          new FormData();


        formData.append(
          "name",
          name
        );


        formData.append(
          "description",
          description
        );


        formData.append(
          "category",
          category
        );


        formData.append(
          "rarity",
          rarity
        );


        formData.append(
          "price",
          price
        );


        formData.append(
          "tokenId",
          tokenId.toString()
        );


        formData.append(
          "seller",
          seller
        );


        formData.append(
          "image",
          image
        );


        const response =
          await fetch(
            "http://localhost:3000/api/items",
            {
              method: "POST",
              body: formData
            }
          );


        let result:
          any = null;


        try {

          result =
            await response.json();

        } catch {

          result = null;

        }


        if (
          !response.ok
        ) {

          throw new Error(
            result?.message ||
            "Blockchain đã đăng NFT nhưng không thể lưu metadata vào Backend."
          );

        }


        console.log(
          "Backend item:",
          result
        );


        // =================================
        // SUCCESS
        // =================================

        setStatus(
          `Đăng bán thành công! Token #${tokenId}`
        );


        showModal(
          "success",
          "Đăng bán thành công!",
          `"${name}" đã được tạo thành NFT và đăng bán với giá ${price} ETH. Token #${tokenId}.`
        );


        resetForm();


      } catch (error: any) {

        console.error(
          "Create item error:",
          error
        );


        let message =
          "Không thể đăng bán vật phẩm.";


        if (
          error?.code ===
          "ACTION_REJECTED"
        ) {

          message =
            "Bạn đã từ chối giao dịch trong MetaMask.";

        } else if (
          error?.message
        ) {

          message =
            error.message;

        }


        setStatus(
          `Lỗi: ${message}`
        );


        showModal(
          "error",
          error?.code ===
            "ACTION_REJECTED"
            ? "Đã hủy giao dịch"
            : "Đăng bán thất bại",
          message
        );


      } finally {

        setLoading(
          false
        );

      }

    };


  // =====================================
  // UI
  // =====================================

  return (

    <main className="sell-page">


      <div className="sell-header">

        <span className="section-label">
          TẠO NFT
        </span>


        <h1>
          Đăng bán vật phẩm
        </h1>


        <p>
          Tạo NFT cho vật phẩm game của bạn
          và đăng bán trực tiếp trên Marketplace.
        </p>

      </div>


      <div className="create-item-layout">


        {/* ================================= */}
        {/* IMAGE */}
        {/* ================================= */}

        <div className="upload-panel">

          <h2>
            Hình ảnh vật phẩm
          </h2>


          <label className="image-upload-box">

            {preview ? (

              <img
                src={preview}
                alt="Xem trước vật phẩm"
                className="image-preview"
              />

            ) : (

              <div className="upload-placeholder">

                <div className="upload-icon">
                  🖼️
                </div>


                <strong>
                  Chọn hình ảnh
                </strong>


                <span>
                  PNG, JPG hoặc WEBP
                </span>


                <span>
                  Tối đa 5 MB
                </span>

              </div>

            )}


            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={
                handleImageChange
              }
              disabled={
                loading
              }
              hidden
            />

          </label>


          {image && (

            <p className="selected-file">
              Đã chọn: {image.name}
            </p>

          )}

        </div>


        {/* ================================= */}
        {/* FORM */}
        {/* ================================= */}

        <div className="create-form-panel">


          <div className="form-group">

            <label>
              Tên vật phẩm
            </label>


            <input
              type="text"
              placeholder="Ví dụ: Kiếm Rồng Lửa"
              value={name}
              disabled={loading}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
            />

          </div>


          <div className="form-group">

            <label>
              Mô tả
            </label>


            <textarea
              placeholder="Mô tả vật phẩm của bạn..."
              value={description}
              disabled={loading}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              rows={5}
            />

          </div>


          <div className="form-row">


            <div className="form-group">

              <label>
                Loại vật phẩm
              </label>


              <select
                value={category}
                disabled={loading}
                onChange={(e) =>
                  setCategory(
                    e.target.value
                  )
                }
              >

                <option value="Weapon">
                  Vũ khí
                </option>

                <option value="Armor">
                  Trang bị
                </option>

                <option value="Skin">
                  Trang phục / Skin
                </option>

                <option value="Other">
                  Khác
                </option>

              </select>

            </div>


            <div className="form-group">

              <label>
                Độ hiếm
              </label>


              <select
                value={rarity}
                disabled={loading}
                onChange={(e) =>
                  setRarity(
                    e.target.value
                  )
                }
              >

                <option value="Common">
                  Thường
                </option>

                <option value="Rare">
                  Hiếm
                </option>

                <option value="Epic">
                  Sử thi
                </option>

                <option value="Legendary">
                  Huyền thoại
                </option>

              </select>

            </div>


          </div>


          <div className="form-group">

            <label>
              Giá bán
            </label>


            <div className="price-input">

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.50"
                value={price}
                disabled={loading}
                onChange={(e) =>
                  setPrice(
                    e.target.value
                  )
                }
              />


              <span>
                ETH
              </span>

            </div>

          </div>


          <div className="transaction-info">

            <strong>
              Quy trình đăng bán
            </strong>

            <p>
              ① Tạo NFT
            </p>

            <p>
              ② Cấp quyền cho Marketplace
            </p>

            <p>
              ③ Đăng NFT lên Marketplace
            </p>

            <p>
              ④ Lưu thông tin vật phẩm
            </p>

          </div>


          <button
            className="create-button"
            onClick={
              createAndSell
            }
            disabled={
              loading
            }
          >

            {loading
              ? "⏳ Đang xử lý..."
              : "🚀 Tạo NFT & Đăng bán"
            }

          </button>


          {status && (

            <div className="create-status">
              {status}
            </div>

          )}


        </div>

      </div>


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
        onClose={
          closeModal
        }
      />


    </main>

  );

}


export default SellItem;