import {
  Link
} from "react-router-dom";

type Props = {
  account: string;
  connectWallet: () => void;
};

function Navbar({
  account,
  connectWallet
}: Props) {

  return (
    <nav className="navbar">

      <Link
        to="/"
        className="logo"
      >
        🎮 GAME<span>MARKET</span>
      </Link>

      <div className="nav-links">

        <Link to="/">
          Chợ vật phẩm
        </Link>

        <Link to="/my-items">
          Kho của tôi
        </Link>

        <Link to="/sell">
          Đăng vật phẩm
        </Link>

        <Link to="/activity">
          Lịch sử giao dịch
        </Link>

      </div>

      <button
        className="wallet-button"
        onClick={connectWallet}
      >
        {account
          ? `${account.slice(
              0,
              6
            )}...${account.slice(
              -4
            )}`
          : "Kết nối ví"}
      </button>

    </nav>
  );
}

export default Navbar;