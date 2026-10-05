import {
  useEffect,
  useState
} from "react";

import {
  BrowserProvider,
  Contract,
  formatEther
} from "ethers";

import {
  Link
} from "react-router-dom";

import type {
  Item
} from "../components/ItemCard";

import {
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI
} from "../blockchain/contracts";


type RecentActivity = {
  key: string;
  type:
    | "listed"
    | "sold"
    | "cancelled";
  listingId: number;
  tokenId: number;
  name: string;
  image: string;
  price: string;
  blockNumber: number;
};


type ListingData = {
  listingId: number;
  tokenId: number;
  price: bigint;
  seller: string;
};


function Dashboard() {

  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    totalNFT,
    setTotalNFT
  ] = useState(0);


  const [
    activeListings,
    setActiveListings
  ] = useState(0);


  const [
    totalListed,
    setTotalListed
  ] = useState(0);


  const [
    totalSold,
    setTotalSold
  ] = useState(0);


  const [
    totalCancelled,
    setTotalCancelled
  ] = useState(0);


  const [
    volume,
    setVolume
  ] = useState("0");


  const [
    recentActivities,
    setRecentActivities
  ] =
    useState<RecentActivity[]>([]);


  // =====================================
  // LOAD DASHBOARD
  // =====================================

  const loadDashboard =
    async () => {

      try {

        setLoading(true);


        if (!window.ethereum) {
          return;
        }


        // =================================
        // METADATA BACKEND
        // =================================

        const response =
          await fetch(
            "http://localhost:3000/api/items"
          );


        const metadata:
          Item[] =
          response.ok
            ? await response.json()
            : [];


        setTotalNFT(
          metadata.length
        );


        // =================================
        // BLOCKCHAIN
        // =================================

        const provider =
          new BrowserProvider(
            window.ethereum
          );


        const marketplace =
          new Contract(
            MARKETPLACE_ADDRESS,
            MARKETPLACE_ABI,
            provider
          );


        // =================================
        // EVENTS
        // =================================

        const [
          listedEvents,
          soldEvents,
          cancelledEvents
        ] =
          await Promise.all([

            marketplace.queryFilter(
              marketplace.filters
                .ItemListed(),
              0,
              "latest"
            ),

            marketplace.queryFilter(
              marketplace.filters
                .ItemSold(),
              0,
              "latest"
            ),

            marketplace.queryFilter(
              marketplace.filters
                .ListingCancelled(),
              0,
              "latest"
            )

          ]);


        setTotalListed(
          listedEvents.length
        );


        setTotalSold(
          soldEvents.length
        );


        setTotalCancelled(
          cancelledEvents.length
        );


        // =================================
        // LISTING MAP
        // =================================

        const listingMap =
          new Map<
            number,
            ListingData
          >();


        for (
          const event
          of listedEvents
        ) {

          if (
            !("args" in event)
          ) {
            continue;
          }


          const listingId =
            Number(
              event.args[0]
            );


          listingMap.set(
            listingId,
            {
              listingId,

              seller:
                String(
                  event.args[1]
                ),

              tokenId:
                Number(
                  event.args[3]
                ),

              price: event.args[4] as bigint,
            }
          );

        }


        // =================================
        // ĐẾM LISTING ĐANG HOẠT ĐỘNG
        // =================================

        let activeCount = 0;


        const listingCount =
          Number(
            await marketplace
              .listingCount()
          );


        for (
          let id = 1;
          id <= listingCount;
          id++
        ) {

          try {

            const listing =
              await marketplace
                .listings(id);


            if (
              listing.active
            ) {

              activeCount++;

            }

          } catch (error) {

            console.error(
              `Không đọc được Listing #${id}`,
              error
            );

          }

        }


        setActiveListings(
          activeCount
        );


        // =================================
        // TỔNG ETH ĐÃ GIAO DỊCH
        // =================================

        let totalVolume =
          0n;


        for (
          const event
          of soldEvents
        ) {

          if (
            !("args" in event)
          ) {
            continue;
          }


          const listingId =
            Number(
              event.args[0]
            );


          const listing =
            listingMap.get(
              listingId
            );


          if (listing) {

            totalVolume +=
              listing.price;

          }

        }


        setVolume(
          formatEther(
            totalVolume
          )
        );


        // =================================
        // HELPER METADATA
        // =================================

        const getMetadata =
          (
            tokenId: number
          ) => {

            return metadata.find(
              (item) =>
                Number(
                  item.tokenId
                ) === tokenId
            );

          };


        // =================================
        // RECENT ACTIVITY
        // =================================

        const recent:
          RecentActivity[] = [];


        // ITEM LISTED

        for (
          const event
          of listedEvents
        ) {

          if (
            !("args" in event)
          ) {
            continue;
          }


          const listingId =
            Number(
              event.args[0]
            );


          const listing =
            listingMap.get(
              listingId
            );


          if (!listing) {
            continue;
          }


          const item =
            getMetadata(
              listing.tokenId
            );


          recent.push({
            key:
              `listed-${event.transactionHash}-${event.index}`,

            type:
              "listed",

            listingId,

            tokenId:
              listing.tokenId,

            name:
              item?.name ||
              `Token #${listing.tokenId}`,

            image:
              item?.image || "",

            price:
              formatEther(
                listing.price
              ),

            blockNumber:
              event.blockNumber
          });

        }


        // ITEM SOLD

        for (
          const event
          of soldEvents
        ) {

          if (
            !("args" in event)
          ) {
            continue;
          }


          const listingId =
            Number(
              event.args[0]
            );


          const listing =
            listingMap.get(
              listingId
            );


          if (!listing) {
            continue;
          }


          const item =
            getMetadata(
              listing.tokenId
            );


          recent.push({
            key:
              `sold-${event.transactionHash}-${event.index}`,

            type:
              "sold",

            listingId,

            tokenId:
              listing.tokenId,

            name:
              item?.name ||
              `Token #${listing.tokenId}`,

            image:
              item?.image || "",

            price:
              formatEther(
                listing.price
              ),

            blockNumber:
              event.blockNumber
          });

        }


        // ITEM CANCELLED

        for (
          const event
          of cancelledEvents
        ) {

          if (
            !("args" in event)
          ) {
            continue;
          }


          const listingId =
            Number(
              event.args[0]
            );


          const listing =
            listingMap.get(
              listingId
            );


          if (!listing) {
            continue;
          }


          const item =
            getMetadata(
              listing.tokenId
            );


          recent.push({
            key:
              `cancelled-${event.transactionHash}-${event.index}`,

            type:
              "cancelled",

            listingId,

            tokenId:
              listing.tokenId,

            name:
              item?.name ||
              `Token #${listing.tokenId}`,

            image:
              item?.image || "",

            price:
              formatEther(
                listing.price
              ),

            blockNumber:
              event.blockNumber
          });

        }


        // =================================
        // SORT + LẤY 5 GẦN NHẤT
        // =================================

        recent.sort(
          (a, b) => {

            if (
              b.blockNumber !==
              a.blockNumber
            ) {

              return (
                b.blockNumber -
                a.blockNumber
              );

            }


            return (
              b.listingId -
              a.listingId
            );

          }
        );


        setRecentActivities(
          recent.slice(
            0,
            5
          )
        );


      } catch (error) {

        console.error(
          "Lỗi tải Dashboard:",
          error
        );


      } finally {

        setLoading(false);

      }

    };


  useEffect(() => {

    loadDashboard();

  }, []);


  // =====================================
  // EVENT INFO
  // =====================================

  const getActivityInfo =
    (
      type:
        RecentActivity["type"]
    ) => {

      if (
        type === "listed"
      ) {

        return {
          icon: "🏷️",
          text: "Đăng bán",
          className:
            "dashboard-listed"
        };

      }


      if (
        type === "sold"
      ) {

        return {
          icon: "🛒",
          text: "Đã bán",
          className:
            "dashboard-sold"
        };

      }


      return {
        icon: "❌",
        text: "Đã hủy",
        className:
          "dashboard-cancelled"
      };

    };


  // =====================================
  // BAR WIDTH
  // =====================================

  const maxActivity =
    Math.max(
      totalListed,
      totalSold,
      totalCancelled,
      1
    );


  const getWidth =
    (
      value: number
    ) => {

      return (
        value /
        maxActivity *
        100
      );

    };


  // =====================================
  // UI
  // =====================================

  return (

    <main className="dashboard-page">


      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <div className="dashboard-header">

        <div>

          <span className="section-label">
            BLOCKCHAIN ANALYTICS
          </span>

          <h1>
            📊 Tổng quan Marketplace
          </h1>

          <p>
            Thống kê hoạt động của
            Game Item Marketplace
            trực tiếp từ blockchain.
          </p>

        </div>


        <button
          className="dashboard-refresh"
          onClick={
            loadDashboard
          }
          disabled={
            loading
          }
        >
          {loading
            ? "Đang tải..."
            : "↻ Làm mới"
          }
        </button>

      </div>


      {/* ================================= */}
      {/* STATS */}
      {/* ================================= */}

      <div className="dashboard-stats">


        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            🎮
          </div>

          <div>

            <span>
              Tổng NFT
            </span>

            <strong>
              {totalNFT}
            </strong>

            <small>
              vật phẩm
            </small>

          </div>

        </div>


        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            🏪
          </div>

          <div>

            <span>
              Đang bán
            </span>

            <strong>
              {activeListings}
            </strong>

            <small>
              listing hoạt động
            </small>

          </div>

        </div>


        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            🛒
          </div>

          <div>

            <span>
              Đã bán
            </span>

            <strong>
              {totalSold}
            </strong>

            <small>
              giao dịch
            </small>

          </div>

        </div>


        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            Ξ
          </div>

          <div>

            <span>
              Khối lượng
            </span>

            <strong>
              {volume}
            </strong>

            <small>
              ETH
            </small>

          </div>

        </div>


      </div>


      {/* ================================= */}
      {/* BODY */}
      {/* ================================= */}

      <div className="dashboard-layout">


        {/* =============================== */}
        {/* ACTIVITY CHART */}
        {/* =============================== */}

        <section className="dashboard-panel">

          <div className="dashboard-panel-title">

            <div>

              <span>
                THỐNG KÊ
              </span>

              <h2>
                Hoạt động Marketplace
              </h2>

            </div>

          </div>


          {loading ? (

            <div className="dashboard-loading">
              Đang đọc blockchain...
            </div>

          ) : (

            <div className="dashboard-bars">


              <div className="dashboard-bar-row">

                <div className="dashboard-bar-label">

                  <span>
                    🏷️ Đăng bán
                  </span>

                  <strong>
                    {totalListed}
                  </strong>

                </div>


                <div className="dashboard-bar-track">

                  <div
                    className="dashboard-bar dashboard-bar-listed"
                    style={{
                      width:
                        `${getWidth(
                          totalListed
                        )}%`
                    }}
                  />

                </div>

              </div>


              <div className="dashboard-bar-row">

                <div className="dashboard-bar-label">

                  <span>
                    🛒 Đã bán
                  </span>

                  <strong>
                    {totalSold}
                  </strong>

                </div>


                <div className="dashboard-bar-track">

                  <div
                    className="dashboard-bar dashboard-bar-sold"
                    style={{
                      width:
                        `${getWidth(
                          totalSold
                        )}%`
                    }}
                  />

                </div>

              </div>


              <div className="dashboard-bar-row">

                <div className="dashboard-bar-label">

                  <span>
                    ❌ Đã hủy
                  </span>

                  <strong>
                    {totalCancelled}
                  </strong>

                </div>


                <div className="dashboard-bar-track">

                  <div
                    className="dashboard-bar dashboard-bar-cancelled"
                    style={{
                      width:
                        `${getWidth(
                          totalCancelled
                        )}%`
                    }}
                  />

                </div>

              </div>


            </div>

          )}


          <div className="dashboard-summary">

            <div>
              <span>
                Tổng listing
              </span>

              <strong>
                {totalListed}
              </strong>
            </div>


            <div>
              <span>
                Thành công
              </span>

              <strong>
                {totalSold}
              </strong>
            </div>


            <div>
              <span>
                Đã hủy
              </span>

              <strong>
                {totalCancelled}
              </strong>
            </div>

          </div>

        </section>


        {/* =============================== */}
        {/* QUICK INFO */}
        {/* =============================== */}

        <section className="dashboard-panel">

          <div className="dashboard-panel-title">

            <div>

              <span>
                MARKETPLACE
              </span>

              <h2>
                Trạng thái hệ thống
              </h2>

            </div>

          </div>


          <div className="dashboard-system-list">


            <div>

              <span>
                Blockchain
              </span>

              <strong>
                🟢 Hardhat Local
              </strong>

            </div>


            <div>

              <span>
                Chain ID
              </span>

              <strong>
                31337
              </strong>

            </div>


            <div>

              <span>
                Smart Contract
              </span>

              <strong>
                🟢 Hoạt động
              </strong>

            </div>


            <div>

              <span>
                Metadata API
              </span>

              <strong>
                🟢 Kết nối
              </strong>

            </div>


            <div>

              <span>
                Listing hoạt động
              </span>

              <strong>
                {activeListings}
              </strong>

            </div>


          </div>


          <Link
            to="/activity"
            className="dashboard-history-button"
          >
            📜 Xem toàn bộ lịch sử
          </Link>

        </section>


      </div>


      {/* ================================= */}
      {/* RECENT */}
      {/* ================================= */}

      <section className="dashboard-panel dashboard-recent-panel">

        <div className="dashboard-panel-title">

          <div>

            <span>
              BLOCKCHAIN
            </span>

            <h2>
              🔥 Giao dịch gần đây
            </h2>

          </div>


          <Link
            to="/activity"
          >
            Xem tất cả →
          </Link>

        </div>


        {loading ? (

          <div className="dashboard-loading">
            Đang tải giao dịch...
          </div>

        ) : recentActivities.length ===
          0 ? (

          <div className="dashboard-loading">
            Chưa có giao dịch.
          </div>

        ) : (

          <div className="dashboard-recent-list">

            {recentActivities.map(
              (activity) => {

                const info =
                  getActivityInfo(
                    activity.type
                  );


                return (

                  <div
                    className="dashboard-recent-item"
                    key={
                      activity.key
                    }
                  >


                    <div className="dashboard-recent-image">

                      {activity.image ? (

                        <img
                          src={
                            activity.image
                          }
                          alt={
                            activity.name
                          }
                        />

                      ) : (

                        <span>
                          🎮
                        </span>

                      )}

                    </div>


                    <div className="dashboard-recent-info">

                      <strong>
                        {activity.name}
                      </strong>

                      <span>
                        Token #
                        {activity.tokenId}
                        {" • "}
                        Listing #
                        {activity.listingId}
                      </span>

                    </div>


                    <div
                      className={`dashboard-recent-type ${info.className}`}
                    >

                      {info.icon}
                      {" "}
                      {info.text}

                    </div>


                    <div className="dashboard-recent-price">

                      <strong>
                        {activity.price}
                        {" "}ETH
                      </strong>

                      <span>
                        Block #
                        {activity.blockNumber}
                      </span>

                    </div>


                  </div>

                );

              }
            )}

          </div>

        )}

      </section>


    </main>

  );

}


export default Dashboard;