import { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Marketplace from "./pages/Marketplace";
import MyItems from "./pages/MyItems";
import SellItem from "./pages/SellItem";

import "./App.css";

function App() {
  const [account, setAccount] = useState("");

  // ============================
  // CHECK WALLET
  // ============================

  const checkWallet = async () => {
    if (!window.ethereum) return;

    try {
      const provider =
        new BrowserProvider(window.ethereum);

      const accounts = await provider.send(
        "eth_accounts",
        []
      );

      if (accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        setAccount("");
      }

    } catch (error) {
      console.error(
        "Check wallet error:",
        error
      );
    }
  };

  // ============================
  // CONNECT WALLET
  // ============================

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Vui lòng cài MetaMask!");
      return;
    }

    try {
      const provider =
        new BrowserProvider(window.ethereum);

      const accounts = await provider.send(
        "eth_requestAccounts",
        []
      );

      setAccount(accounts[0]);

    } catch (error) {
      console.error(
        "Connect wallet error:",
        error
      );
    }
  };

  // ============================
  // LISTEN METAMASK
  // ============================

  useEffect(() => {
    checkWallet();

    if (!window.ethereum) return;

    const handleAccountsChanged = (
      accounts: string[]
    ) => {
      console.log(
        "MetaMask account changed:",
        accounts[0]
      );

      if (accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        setAccount("");
      }
    };

    const handleChainChanged = () => {
      // Network thay đổi -> tải lại trạng thái DApp
      window.location.reload();
    };

    window.ethereum.on(
      "accountsChanged",
      handleAccountsChanged
    );

    window.ethereum.on(
      "chainChanged",
      handleChainChanged
    );

    return () => {
      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );

      window.ethereum.removeListener(
        "chainChanged",
        handleChainChanged
      );
    };
  }, []);

  return (
    <BrowserRouter>

      <Navbar
        account={account}
        connectWallet={connectWallet}
      />

      <Routes>

        <Route
          path="/"
          element={
            <Marketplace />
          }
        />

        <Route
          path="/my-items"
          element={
            <MyItems account={account} />
          }
        />

        <Route
          path="/sell"
          element={
            <SellItem />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;