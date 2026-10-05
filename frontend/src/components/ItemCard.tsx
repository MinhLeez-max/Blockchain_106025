import {
  useEffect,
  useState
} from "react";

import {
  Link
} from "react-router-dom";

import {
  isFavorite,
  toggleFavorite
} from "../utils/wishlist";


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

  const [
    favorite,
    setFavorite
  ] = useState(false);


  useEffect(() => {

    setFavorite(
      isFavorite(
        item.tokenId
      )
    );

  }, [item.tokenId]);


  // =====================================
  // YÊU THÍCH
  // =====================================

  const handleFavorite =
    (
      event:
        React.MouseEvent
    ) => {

      event.preventDefault();
      event.stopPropagation();

      const result =
        toggleFavorite(
          item.tokenId
        );

      setFavorite(
        result
      );

    };


  return (

    <div className="game-card">


      {/* ================================= */}
      {/* HÌNH ẢNH */}
      {/* ================================= */}

      <div className="image-container">

        <img
          src={item.image}
          alt={item.name}
        />


        {/* NÚT YÊU THÍCH */}

        <button
          type="button"
          className={
            favorite
              ? "favorite-button active"
              : "favorite-button"
          }
          onClick={
            handleFavorite
          }
          title={
            favorite
              ? "Bỏ khỏi yêu thích"
              : "Thêm vào yêu thích"
          }
        >

          {favorite
            ? "♥"
            : "♡"
          }

        </button>


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


      {/* ================================= */}
      {/* NỘI DUNG */}
      {/* ================================= */}

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

            {item.seller.slice(
              0,
              6
            )}

            ...

            {item.seller.slice(
              -4
            )}

          </div>

        )}


        {/* ================================= */}
        {/* GIÁ + MUA */}
        {/* ================================= */}

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
                  : "Mua ngay"
                }

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


        {/* ================================= */}
        {/* CHI TIẾT */}
        {/* ================================= */}

        <Link
          to={`/item/${item.tokenId}`}
          className="detail-button"
        >
          🔍 Xem chi tiết
        </Link>

      </div>

    </div>

  );

}


export default ItemCard;