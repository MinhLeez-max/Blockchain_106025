import { useState } from "react";
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
  const [tokenId, setTokenId] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const sellItem = async () => {
    try {
      if (!window.ethereum) {
        alert("Vui lòng cài MetaMask!");
        return;
      }

      if (!tokenId || !price) {
        alert("Nhập Token ID và giá bán.");
        return;
      }

      setLoading(true);

      const provider =
        new BrowserProvider(window.ethereum);

      const network =
        await provider.getNetwork();

      if (network.chainId !== 31337n) {
        alert("Hãy chuyển sang Hardhat Local.");
        return;
      }

      const signer =
        await provider.getSigner();

      const seller =
        await signer.getAddress();

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

      const owner =
        await gameItem.ownerOf(tokenId);

      if (
        owner.toLowerCase() !==
        seller.toLowerCase()
      ) {
        alert("Bạn không sở hữu NFT này.");
        return;
      }

      const approveTx =
        await gameItem.approve(
          MARKETPLACE_ADDRESS,
          tokenId
        );

      await approveTx.wait();

      const listTx =
        await marketplace.listItem(
          GAME_ITEM_ADDRESS,
          tokenId,
          parseEther(price)
        );

      await listTx.wait();

      alert("Đăng bán NFT thành công!");

      setTokenId("");
      setPrice("");

    } catch (error) {
      console.error(error);
      alert("Không thể đăng bán NFT.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">

      <div className="sell-box">

        <span className="small-title">
          CREATE LISTING
        </span>

        <h1>Sell Game Item</h1>

        <p>
          List one of your NFTs on the marketplace.
        </p>

        <label>Token ID</label>

        <input
          type="number"
          placeholder="Example: 1"
          value={tokenId}
          onChange={(e) =>
            setTokenId(e.target.value)
          }
        />

        <label>Price (ETH)</label>

        <input
          type="number"
          step="0.01"
          placeholder="Example: 1.5"
          value={price}
          onChange={(e) =>
            setPrice(e.target.value)
          }
        />

        <button
          onClick={sellItem}
          disabled={loading}
        >
          {loading
            ? "Processing..."
            : "List Item For Sale"}
        </button>

      </div>

    </div>
  );
}

export default SellItem;