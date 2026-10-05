const WISHLIST_KEY =
  "game-market-wishlist";

export function getWishlist():
  number[] {

  try {

    const data =
      localStorage.getItem(
        WISHLIST_KEY
      );

    if (!data) {
      return [];
    }

    const parsed =
      JSON.parse(data);

    if (
      !Array.isArray(parsed)
    ) {
      return [];
    }

    return parsed
      .map(Number)
      .filter(
        (id) =>
          Number.isFinite(id)
      );

  } catch (error) {

    console.error(
      "Lỗi đọc Wishlist:",
      error
    );

    return [];

  }
}


export function isFavorite(
  tokenId: number
) {

  return getWishlist()
    .includes(tokenId);

}


export function addFavorite(
  tokenId: number
) {

  const wishlist =
    getWishlist();

  if (
    !wishlist.includes(tokenId)
  ) {

    wishlist.push(tokenId);

  }

  localStorage.setItem(
    WISHLIST_KEY,
    JSON.stringify(wishlist)
  );

  window.dispatchEvent(
    new Event(
      "wishlistChanged"
    )
  );

}


export function removeFavorite(
  tokenId: number
) {

  const wishlist =
    getWishlist()
      .filter(
        (id) =>
          id !== tokenId
      );

  localStorage.setItem(
    WISHLIST_KEY,
    JSON.stringify(wishlist)
  );

  window.dispatchEvent(
    new Event(
      "wishlistChanged"
    )
  );

}


export function toggleFavorite(
  tokenId: number
) {

  if (
    isFavorite(tokenId)
  ) {

    removeFavorite(tokenId);

    return false;

  }

  addFavorite(tokenId);

  return true;

}