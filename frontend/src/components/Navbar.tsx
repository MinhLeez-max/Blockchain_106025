import { Link } from "react-router-dom";

type Props = {
  account: string;
  connectWallet: () => void;
};

function Navbar({ account, connectWallet }: Props) {
  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        🎮 GAME<span>MARKET</span>
      </Link>

      <div className="nav-links">
        <Link to="/">Marketplace</Link>
        <Link to="/my-items">My Items</Link>
        <Link to="/sell">Sell Item</Link>
      </div>

      <button
        className="wallet-button"
        onClick={connectWallet}
      >
        {account
          ? `${account.slice(0, 6)}...${account.slice(-4)}`
          : "Connect Wallet"}
      </button>
    </nav>
  );
}

export default Navbar;