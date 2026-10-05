import {
  useState
} from "react";

import {
  BrowserProvider,
  Contract,
  parseEther
} from "ethers";

import {
  GAME_ITEM_ADDRESS,
  GAME_ITEM_ABI,
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI
} from "../blockchain/contracts";

function SellItem() {

  const [name, setName] =
    useState("");

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

  const [price, setPrice] =
    useState("");

  const [image, setImage] =
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

    setImage(file);

    const previewUrl =
      URL.createObjectURL(file);

    setPreview(
      previewUrl
    );
  };

  // =====================================
  // TẠO NFT + ĐĂNG BÁN
  // =====================================

  const createAndSell =
    async () => {

      if (!window.ethereum) {
        alert(
          "Vui lòng cài đặt MetaMask."
        );

        return;
      }

      if (
        !name.trim() ||
        !description.trim() ||
        !price ||
        !image
      ) {
        alert(
          "Vui lòng nhập đầy đủ thông tin và chọn hình ảnh."
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

      try {

        setLoading(true);

        // =================================
        // CONNECT WALLET
        // =================================

        setStatus(
          "Đang kết nối ví..."
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
            "Vui lòng chuyển MetaMask sang mạng Hardhat Local (Chain ID 31337)."
          );

          return;
        }

        const signer =
          await provider.getSigner();

        const seller =
          await signer.getAddress();

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
        // TOKEN ID SẮP ĐƯỢC MINT
        // =================================

        const tokenIdBefore =
          await gameItem.nextTokenId();

        const tokenId =
          Number(
            tokenIdBefore
          );

        console.log(
          "Token ID mới:",
          tokenId
        );

        // =================================
        // TOKEN URI
        // =================================

        const tokenURI =
          `gameitem://${tokenId}`;

        // =================================
        // MINT NFT
        // =================================

        setStatus(
          "1/4 - Đang tạo NFT. Vui lòng xác nhận trên MetaMask..."
        );

        const mintTx =
          await gameItem.mintItem(
            tokenURI
          );

        console.log(
          "Mint TX:",
          mintTx.hash
        );

        await mintTx.wait();

        // =================================
        // APPROVE
        // =================================

        setStatus(
          "2/4 - Đang cấp quyền cho Marketplace..."
        );

        const approveTx =
          await gameItem.approve(
            MARKETPLACE_ADDRESS,
            tokenId
          );

        console.log(
          "Approve TX:",
          approveTx.hash
        );

        await approveTx.wait();

        // =================================
        // LIST ITEM
        // =================================

        setStatus(
          "3/4 - Đang đăng bán vật phẩm..."
        );

        const listTx =
          await marketplace.listItem(
            GAME_ITEM_ADDRESS,
            tokenId,
            parseEther(price)
          );

        console.log(
          "List TX:",
          listTx.hash
        );

        await listTx.wait();

        // =================================
        // LƯU BACKEND
        // =================================

        setStatus(
          "4/4 - Đang lưu thông tin vật phẩm..."
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

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
            "Không thể lưu vật phẩm."
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

        alert(
          `Đăng bán "${name}" thành công!\nToken #${tokenId}`
        );

        // RESET FORM

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
            "Bạn đã từ chối giao dịch trên MetaMask.";
        } else if (
          error?.message
        ) {
          message =
            error.message;
        }

        setStatus(
          `Lỗi: ${message}`
        );

        alert(
          message
        );

      } finally {

        setLoading(false);

      }
    };

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

        {/* ========================= */}
        {/* IMAGE */}
        {/* ========================= */}

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
              hidden
            />

          </label>

          {image && (
            <p className="selected-file">
              Đã chọn: {image.name}
            </p>
          )}

        </div>

        {/* ========================= */}
        {/* FORM */}
        {/* ========================= */}

        <div className="create-form-panel">

          <div className="form-group">

            <label>
              Tên vật phẩm
            </label>

            <input
              type="text"
              placeholder="Ví dụ: Kiếm Rồng Lửa"
              value={name}
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
              ? "Đang xử lý..."
              : "🚀 Tạo NFT & Đăng bán"}

          </button>

          {status && (
            <div className="create-status">
              {status}
            </div>
          )}

        </div>

      </div>

    </main>
  );
}

export default SellItem;