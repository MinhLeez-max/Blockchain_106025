// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract GameItem is ERC721URIStorage {

    uint256 private _nextTokenId;

    event ItemMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string tokenURI
    );

    constructor()
        ERC721(
            "GameItem",
            "GIT"
        )
    {
        _nextTokenId = 1;
    }

    // =====================================
    // NGƯỜI DÙNG TỰ TẠO NFT
    // =====================================

    function mintItem(
        string memory tokenURI
    )
        public
        returns (uint256)
    {
        uint256 tokenId =
            _nextTokenId;

        _nextTokenId++;

        // NFT thuộc người đang kết nối ví
        _safeMint(
            msg.sender,
            tokenId
        );

        _setTokenURI(
            tokenId,
            tokenURI
        );

        emit ItemMinted(
            tokenId,
            msg.sender,
            tokenURI
        );

        return tokenId;
    }

    // =====================================
    // XEM TOKEN ID TIẾP THEO
    // =====================================

    function nextTokenId()
        external
        view
        returns (uint256)
    {
        return _nextTokenId;
    }
}