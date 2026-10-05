// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Marketplace is ReentrancyGuard {

    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
    }

    uint256 public listingCount;

    mapping(uint256 => Listing) public listings;

    event ItemListed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price
    );

    event ItemSold(
        uint256 indexed listingId,
        address indexed buyer
    );

    event ListingCancelled(
        uint256 indexed listingId
    );

    // Đăng NFT lên marketplace
    function listItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external {

        require(price > 0, "Price must be greater than 0");

        IERC721 nft = IERC721(nftContract);

        require(
            nft.ownerOf(tokenId) == msg.sender,
            "You are not the owner"
        );

        require(
            nft.getApproved(tokenId) == address(this) ||
            nft.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );

        listingCount++;

        listings[listingCount] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });

        emit ItemListed(
            listingCount,
            msg.sender,
            nftContract,
            tokenId,
            price
        );
    }

    // Mua NFT
    function buyItem(uint256 listingId)
        external
        payable
        nonReentrant
    {
        Listing storage listing = listings[listingId];

        require(listing.active, "Listing is not active");
        require(msg.value == listing.price, "Incorrect price");
        require(msg.sender != listing.seller, "Seller cannot buy own item");

        listing.active = false;

        IERC721(listing.nftContract).safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );

        (bool success, ) = payable(listing.seller).call{
            value: listing.price
        }("");

        require(success, "Payment failed");

        emit ItemSold(listingId, msg.sender);
    }

    // Huy dang ban
    function cancelListing(uint256 listingId) external {

        Listing storage listing = listings[listingId];

        require(listing.active, "Listing is not active");

        require(
            listing.seller == msg.sender,
            "Only seller can cancel"
        );

        listing.active = false;

        emit ListingCancelled(listingId);
    }
}