import {
  useEffect,
  useState
} from "react";

import {
  Link
} from "react-router-dom";

import ItemCard from
  "../components/ItemCard";

import type {
  Item
} from "../components/ItemCard";

import {
  getWishlist
} from "../utils/wishlist";


function Wishlist() {

  const [
    items,
    setItems
  ] =
    useState<Item[]>([]);


  const [
    loading,
    setLoading
  ] =
    useState(true);


  // =====================================
  // LOAD WISHLIST
  // =====================================

  const loadWishlist =
    async () => {

      try {

        setLoading(true);


        const favoriteIds =
          getWishlist();


        if (
          favoriteIds.length === 0
        ) {

          setItems([]);

          return;

        }


        const response =
          await fetch(
            "http://localhost:3000/api/items"
          );


        if (!response.ok) {

          throw new Error(
            "Không thể tải vật phẩm."
          );

        }


        const allItems:
          Item[] =
          await response.json();


        const favoriteItems =
          allItems.filter(
            (item) =>
              favoriteIds.includes(
                Number(
                  item.tokenId
                )
              )
          );


        setItems(
          favoriteItems
        );


      } catch (error) {

        console.error(
          "Lỗi tải Wishlist:",
          error
        );


      } finally {

        setLoading(false);

      }

    };


  useEffect(() => {

    loadWishlist();


    const handleChange =
      () => {

        loadWishlist();

      };


    window.addEventListener(
      "wishlistChanged",
      handleChange
    );


    return () => {

      window.removeEventListener(
        "wishlistChanged",
        handleChange
      );

    };

  }, []);


  // =====================================
  // LOADING
  // =====================================

  if (loading) {

    return (

      <main className="wishlist-page">

        <div className="empty-state">

          <div className="empty-icon">
            ⏳
          </div>

          <h2>
            Đang tải danh sách yêu thích...
          </h2>

        </div>

      </main>

    );

  }


  // =====================================
  // UI
  // =====================================

  return (

    <main className="wishlist-page">

      <div className="wishlist-header">

        <div>

          <span className="section-label">
            BỘ SƯU TẬP
          </span>

          <h1>
            Vật phẩm yêu thích
          </h1>

          <p>
            Những NFT bạn đã lưu để
            xem hoặc mua sau.
          </p>

        </div>


        <div className="wishlist-count">

          <strong>
            {items.length}
          </strong>

          <span>
            vật phẩm
          </span>

        </div>

      </div>


      {items.length === 0 ? (

        <div className="empty-state">

          <div className="empty-icon">
            ♡
          </div>

          <h2>
            Chưa có vật phẩm yêu thích
          </h2>

          <p>
            Bấm biểu tượng trái tim trên
            một NFT để thêm vào đây.
          </p>

          <Link
            to="/"
            className="detail-back-button"
          >
            Khám phá Marketplace
          </Link>

        </div>

      ) : (

        <div className="items-grid">

          {items.map(
            (item) => (

              <ItemCard
                key={
                  item.tokenId
                }
                item={
                  item
                }
              />

            )
          )}

        </div>

      )}

    </main>

  );

}


export default Wishlist;