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
};

type Props = {
  item: Item;
  active?: boolean;
  buying?: boolean;
  onBuy?: () => void;
};

function ItemCard({
  item,
  active,
  buying,
  onBuy
}: Props) {
  return (
    <div className="game-card">

      <div className="image-container">
        <img src={item.image} alt={item.name} />

        <span
          className={`rarity ${(item.rarity || "Common").toLowerCase()}`}
        >
          {item.rarity || "Common"}
        </span>
      </div>

      <div className="card-content">

        <div className="category">
          {item.category || "Game Item"}
        </div>

        <h3>{item.name}</h3>

        <p>{item.description}</p>

        <div className="token">
          Token #{item.tokenId}
        </div>

        <div className="card-bottom">

          <div>
            <small>PRICE</small>
            <strong>{item.price} ETH</strong>
          </div>

          {active === true ? (
            <button
              className="buy-button"
              disabled={buying}
              onClick={onBuy}
            >
              {buying ? "Processing..." : "Buy Now"}
            </button>
          ) : active === false ? (
            <button className="sold-button" disabled>
              SOLD / NOT LISTED
            </button>
          ) : null}

        </div>
      </div>
    </div>
  );
}

export default ItemCard;