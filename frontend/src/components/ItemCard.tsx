export type Item = {
  id: number;
  name: string;
  description: string;
  category: string;
  rarity: string;
  price: string;
  image: string;
  tokenId: number;
  listingId?: number;
  seller?: string;
};

type Props = {
  item: Item;
  active?: boolean;
  buying?: boolean;
  isSeller?: boolean;
  onBuy?: () => void;
};

// =====================================
// DỊCH LOẠI VẬT PHẨM
// =====================================

function translateCategory(
  category: string
) {
  const categories:
    Record<string, string> = {
      Weapon: "Vũ khí",
      Armor: "Trang bị",
      Skin: "Skin",
      Other: "Khác"
    };

  return (
    categories[category] ||
    category
  );
}

// =====================================
// DỊCH ĐỘ HIẾM
// =====================================

function translateRarity(
  rarity: string
) {
  const rarities:
    Record<string, string> = {
      Common: "Thường",
      Rare: "Hiếm",
      Epic: "Sử thi",
      Legendary: "Huyền thoại"
    };

  return (
    rarities[rarity] ||
    rarity
  );
}

function ItemCard({
  item,
  active,
  buying,
  isSeller,
  onBuy
}: Props) {

  return (
    <div className="game-card">

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
            item.category ||
            "Other"
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

        {item.seller && (
          <div className="token">
            Người đăng:{" "}
            {item.seller.slice(0, 6)}
            ...
            {item.seller.slice(-4)}
          </div>
        )}

        <div className="card-bottom">

          <div>
            <small>
              GIÁ BÁN
            </small>

            <strong>
              {item.price} ETH
            </strong>
          </div>

          {active === true ? (

            isSeller ? (

              <button
                className="sold-button"
                disabled
              >
                VẬT PHẨM CỦA BẠN
              </button>

            ) : (

              <button
                className="buy-button"
                disabled={buying}
                onClick={onBuy}
              >
                {buying
                  ? "Đang xử lý..."
                  : "Mua ngay"}
              </button>

            )

          ) : active === false ? (

            <button
              className="sold-button"
              disabled
            >
              KHÔNG CÒN BÁN
            </button>

          ) : null}

        </div>

      </div>

    </div>
  );
}

export default ItemCard;