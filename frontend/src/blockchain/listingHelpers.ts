import { Contract } from "ethers";

export type ListingInfo = {
  listingId: number;
  seller: string;
  nftContract: string;
  tokenId: number;
  price: bigint;
  active: boolean;
};

export async function loadAllListings(
  marketplace: Contract
): Promise<ListingInfo[]> {

  const count = Number(
    await marketplace.listingCount()
  );

  console.log(
    "Total listings:",
    count
  );

  const listings: ListingInfo[] = [];

  // Chỉ đọc blockchain 1 vòng
  for (
    let listingId = 1;
    listingId <= count;
    listingId++
  ) {
    try {

      const listing =
        await marketplace.listings(
          listingId
        );

      listings.push({
        listingId,
        seller: listing.seller,
        nftContract:
          listing.nftContract,
        tokenId:
          Number(listing.tokenId),
        price: listing.price,
        active: listing.active
      });

    } catch (error) {

      console.error(
        `Cannot read listing #${listingId}`,
        error
      );

    }
  }

  return listings;
}

export function findLatestListing(
  listings: ListingInfo[],
  tokenId: number
): ListingInfo | null {

  // Đi ngược từ listing mới nhất
  for (
    let i = listings.length - 1;
    i >= 0;
    i--
  ) {

    if (
      listings[i].tokenId === tokenId
    ) {
      return listings[i];
    }

  }

  return null;
}