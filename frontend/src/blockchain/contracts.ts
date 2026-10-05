// =====================================
// CONTRACT ADDRESSES
// =====================================

export const GAME_ITEM_ADDRESS =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const MARKETPLACE_ADDRESS =
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// =====================================
// GAME ITEM ABI
// =====================================

export const GAME_ITEM_ABI = [
  "function mintItem(string tokenURI) returns (uint256)",

  "function nextTokenId() view returns (uint256)",

  "function ownerOf(uint256 tokenId) view returns (address)",

  "function tokenURI(uint256 tokenId) view returns (string)",

  "function approve(address to,uint256 tokenId)",

  "function setApprovalForAll(address operator,bool approved)",

  "function getApproved(uint256 tokenId) view returns (address)",

  "function isApprovedForAll(address owner,address operator) view returns (bool)",

  "event ItemMinted(uint256 indexed tokenId,address indexed owner,string tokenURI)"
];

// =====================================
// MARKETPLACE ABI
// =====================================

export const MARKETPLACE_ABI = [
  "function buyItem(uint256 listingId) external payable",

  "function listItem(address nftContract,uint256 tokenId,uint256 price) external",

  "function cancelListing(uint256 listingId) external",

  "function listingCount() view returns (uint256)",

  "function listings(uint256) view returns (address seller,address nftContract,uint256 tokenId,uint256 price,bool active)",

  "event ItemListed(uint256 indexed listingId,address indexed seller,address indexed nftContract,uint256 tokenId,uint256 price)",

  "event ItemSold(uint256 indexed listingId,address indexed buyer)",

  "event ListingCancelled(uint256 indexed listingId)"
];