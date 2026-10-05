import NotificationBell
  from "./NotificationBell";

import {
  Link,
  NavLink
} from "react-router-dom";


type Props = {
  account: string;
  connectWallet: () => void;
};


function Navbar({
  account,
  connectWallet
}: Props) {

  // =====================================
  // NAVIGATION
  // =====================================

  const navItems = [
    {
      to: "/",
      label: "Chợ vật phẩm",
      icon: "◈",
      end: true
    },
    {
      to: "/wishlist",
      label: "Yêu thích",
      icon: "♡"
    },
    {
      to: "/my-items",
      label: "Kho của tôi",
      icon: "◇"
    },
    {
      to: "/sell",
      label: "Đăng vật phẩm",
      icon: "+"
    },
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: "▦"
    },
    {
      to: "/activity",
      label: "Lịch sử",
      icon: "↗"
    }
  ];


  return (

    <header className="navbar-shell">

      <nav className="navbar navbar-v2">


        {/* ================================= */}
        {/* LOGO */}
        {/* ================================= */}

        <Link
          to="/"
          className="logo logo-v2"
        >

          <div className="logo-icon">

            <span>
              🎮
            </span>

            <div className="logo-icon-glow"></div>

          </div>


          <div className="logo-text">

            <strong>
              GAME
              <span>
                MARKET
              </span>
            </strong>

            <small>
              NFT MARKETPLACE
            </small>

          </div>

        </Link>


        {/* ================================= */}
        {/* NAVIGATION */}
        {/* ================================= */}

        <div className="nav-links nav-links-v2">

          {navItems.map(
            (item) => (

              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({
                  isActive
                }) =>
                  isActive
                    ? "nav-item-v2 active"
                    : "nav-item-v2"
                }
              >

                <span className="nav-item-icon">
                  {item.icon}
                </span>

                <span className="nav-item-label">
                  {item.label}
                </span>

                <span className="nav-active-dot"></span>

              </NavLink>

            )
          )}

        </div>


        {/* ================================= */}
        {/* RIGHT ACTIONS */}
        {/* ================================= */}

        <div className="navbar-actions">


          <div className="notification-wrapper">
            <NotificationBell />
          </div>


          <button
            type="button"
            className={
              account
                ? "wallet-button wallet-button-v2 connected"
                : "wallet-button wallet-button-v2"
            }
            onClick={connectWallet}
          >

            <span className="wallet-status">

              <span className="wallet-status-dot"></span>

            </span>


            <span className="wallet-content">

              <small>

                {account
                  ? "VÍ ĐÃ KẾT NỐI"
                  : "METAMASK"
                }

              </small>


              <strong>

                {account
                  ? `${account.slice(
                      0,
                      6
                    )}...${account.slice(
                      -4
                    )}`
                  : "Kết nối ví"
                }

              </strong>

            </span>


            <span className="wallet-arrow">
              ›
            </span>

          </button>


        </div>


      </nav>

    </header>

  );

}


export default Navbar;