import {
  useEffect,
  useState
} from "react";

import {
  BrowserProvider,
  Contract,
  formatEther
} from "ethers";

import type {
  Item
} from "../components/ItemCard";

import {
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI
} from "../blockchain/contracts";

type ActivityType =
  | "listed"
  | "sold"
  | "cancelled";

type ActivityItem = {
  key: string;
  type: ActivityType;
  listingId: number;
  tokenId: number;
  name: string;
  image: string;
  price: string;
  seller: string;
  buyer?: string;
  blockNumber: number;
  transactionHash: string;
};

type ListingData = {
  listingId: number;
  tokenId: number;
  price: bigint;
  seller: string;
  blockNumber: number;
  transactionHash: string;
};

function shortAddress(
  address?: string
) {
  if (!address) {
    return "Không có";
  }

  return (
    address.slice(0, 6) +
    "..." +
    address.slice(-4)
  );
}

function Activity() {

  const [
    activities,
    setActivities
  ] =
    useState<ActivityItem[]>([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    filter,
    setFilter
  ] =
    useState<
      "all" |
      ActivityType
    >("all");

  const [
    onlyMine,
    setOnlyMine
  ] = useState(false);

  const [
    account,
    setAccount
  ] = useState("");

  // =====================================
  // LOAD
  // =====================================

  useEffect(() => {
    loadActivity();
  }, []);

  // =====================================
  // LOAD LỊCH SỬ BLOCKCHAIN
  // =====================================

  const loadActivity =
    async () => {

      try {

        setLoading(true);

        if (!window.ethereum) {
          return;
        }

        // =================================
        // METADATA
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

        // =================================
        // PROVIDER
        // =================================

        const provider =
          new BrowserProvider(
            window.ethereum
          );

        const accounts:
          string[] =
          await provider.send(
            "eth_accounts",
            []
          );

        if (
          accounts.length > 0
        ) {
          setAccount(
            accounts[0]
          );
        }

        const marketplace =
          new Contract(
            MARKETPLACE_ADDRESS,
            MARKETPLACE_ABI,
            provider
          );

        // =================================
        // QUERY EVENTS
        // =================================

        const listedFilter =
          marketplace.filters
            .ItemListed();

        const soldFilter =
          marketplace.filters
            .ItemSold();

        const cancelledFilter =
          marketplace.filters
            .ListingCancelled();

        const [
          listedEvents,
          soldEvents,
          cancelledEvents
        ] =
          await Promise.all([
            marketplace.queryFilter(
              listedFilter,
              0,
              "latest"
            ),

            marketplace.queryFilter(
              soldFilter,
              0,
              "latest"
            ),

            marketplace.queryFilter(
              cancelledFilter,
              0,
              "latest"
            )
          ]);

        // =================================
        // MAP LISTING
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

          const seller =
            String(
              event.args[1]
            );

          const tokenId =
            Number(
              event.args[3]
            );

          const price =
            event.args[4] as bigint;

          listingMap.set(
            listingId,
            {
              listingId,
              tokenId,
              price,
              seller,
              blockNumber:
                event.blockNumber,

              transactionHash:
                event.transactionHash
            }
          );
        }

        // =================================
        // HELPER METADATA
        // =================================

        const getMetadata = (
          tokenId: number
        ) => {

          return metadata.find(
            (item) =>
              item.tokenId ===
              tokenId
          );
        };

        const result:
          ActivityItem[] = [];

        // =================================
        // EVENT: LISTED
        // =================================

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

          result.push({
            key:
              `listed-${event.transactionHash}-${event.index}`,

            type: "listed",

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

            seller:
              listing.seller,

            blockNumber:
              event.blockNumber,

            transactionHash:
              event.transactionHash
          });
        }

        // =================================
        // EVENT: SOLD
        // =================================

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

          const buyer =
            String(
              event.args[1]
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

          result.push({
            key:
              `sold-${event.transactionHash}-${event.index}`,

            type: "sold",

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

            seller:
              listing.seller,

            buyer,

            blockNumber:
              event.blockNumber,

            transactionHash:
              event.transactionHash
          });
        }

        // =================================
        // EVENT: CANCELLED
        // =================================

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

          result.push({
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

            seller:
              listing.seller,

            blockNumber:
              event.blockNumber,

            transactionHash:
              event.transactionHash
          });
        }

        // =================================
        // MỚI NHẤT TRƯỚC
        // =================================

        result.sort(
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

        setActivities(
          result
        );

      } catch (error) {

        console.error(
          "Lỗi tải lịch sử:",
          error
        );

      } finally {

        setLoading(false);

      }
    };

  // =====================================
  // FILTER
  // =====================================

  const filteredActivities =
    activities.filter(
      (activity) => {

        const matchType =
          filter === "all" ||
          activity.type ===
            filter;

        let matchAccount =
          true;

        if (
          onlyMine &&
          account
        ) {

          const lowerAccount =
            account.toLowerCase();

          matchAccount =
            activity.seller
              .toLowerCase() ===
              lowerAccount ||
            activity.buyer
              ?.toLowerCase() ===
              lowerAccount;
        }

        return (
          matchType &&
          matchAccount
        );
      }
    );

  // =====================================
  // EVENT INFO
  // =====================================

  const getEventInfo = (
    type: ActivityType
  ) => {

    if (type === "listed") {
      return {
        icon: "🏷️",
        title:
          "Đăng bán",
        className:
          "activity-listed"
      };
    }

    if (type === "sold") {
      return {
        icon: "🛒",
        title:
          "Đã bán",
        className:
          "activity-sold"
      };
    }

    return {
      icon: "❌",
      title:
        "Hủy đăng bán",
      className:
        "activity-cancelled"
    };
  };

  // =====================================
  // UI
  // =====================================

  return (
    <main className="activity-page">

      <div className="activity-header">

        <span className="small-title">
          BLOCKCHAIN ACTIVITY
        </span>

        <h1>
          Lịch sử giao dịch
        </h1>

        <p>
          Theo dõi các hoạt động đăng bán,
          mua và hủy bán vật phẩm được ghi
          nhận trực tiếp trên blockchain.
        </p>

      </div>

      {/* ================================= */}
      {/* THỐNG KÊ */}
      {/* ================================= */}

      <div className="activity-stats">

        <div>
          <span>
            Tổng hoạt động
          </span>

          <strong>
            {activities.length}
          </strong>
        </div>

        <div>
          <span>
            Đăng bán
          </span>

          <strong>
            {
              activities.filter(
                (item) =>
                  item.type ===
                  "listed"
              ).length
            }
          </strong>
        </div>

        <div>
          <span>
            Đã bán
          </span>

          <strong>
            {
              activities.filter(
                (item) =>
                  item.type ===
                  "sold"
              ).length
            }
          </strong>
        </div>

        <div>
          <span>
            Đã hủy
          </span>

          <strong>
            {
              activities.filter(
                (item) =>
                  item.type ===
                  "cancelled"
              ).length
            }
          </strong>
        </div>

      </div>

      {/* ================================= */}
      {/* FILTER */}
      {/* ================================= */}

      <div className="activity-toolbar">

        <div className="activity-filters">

          <button
            className={
              filter === "all"
                ? "active-category"
                : ""
            }
            onClick={() =>
              setFilter("all")
            }
          >
            Tất cả
          </button>

          <button
            className={
              filter === "listed"
                ? "active-category"
                : ""
            }
            onClick={() =>
              setFilter("listed")
            }
          >
            Đăng bán
          </button>

          <button
            className={
              filter === "sold"
                ? "active-category"
                : ""
            }
            onClick={() =>
              setFilter("sold")
            }
          >
            Đã bán
          </button>

          <button
            className={
              filter ===
              "cancelled"
                ? "active-category"
                : ""
            }
            onClick={() =>
              setFilter(
                "cancelled"
              )
            }
          >
            Đã hủy
          </button>

        </div>

        <label className="my-activity-toggle">

          <input
            type="checkbox"
            checked={onlyMine}
            onChange={(e) =>
              setOnlyMine(
                e.target.checked
              )
            }
          />

          Chỉ giao dịch của tôi

        </label>

      </div>

      {/* ================================= */}
      {/* CONTENT */}
      {/* ================================= */}

      {loading ? (

        <div className="empty-state">

          <div>
            ⏳
          </div>

          <h2>
            Đang đọc blockchain...
          </h2>

        </div>

      ) : filteredActivities.length ===
        0 ? (

        <div className="empty-state">

          <div>
            📜
          </div>

          <h2>
            Chưa có lịch sử giao dịch
          </h2>

          <p>
            Các hoạt động Marketplace sẽ
            xuất hiện tại đây.
          </p>

        </div>

      ) : (

        <div className="activity-list">

          {filteredActivities.map(
            (activity) => {

              const info =
                getEventInfo(
                  activity.type
                );

              return (

                <div
                  className="activity-card"
                  key={activity.key}
                >

                  <div className="activity-item-image">

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

                      <div>
                        🎮
                      </div>

                    )}

                  </div>

                  <div className="activity-main">

                    <div
                      className={`activity-type ${info.className}`}
                    >
                      {info.icon}
                      {" "}
                      {info.title}
                    </div>

                    <h3>
                      {activity.name}
                    </h3>

                    <div className="activity-token">
                      Token #
                      {activity.tokenId}
                      {" • "}
                      Listing #
                      {activity.listingId}
                    </div>

                    <div className="activity-addresses">

                      <span>
                        Người bán:{" "}
                        <strong>
                          {shortAddress(
                            activity.seller
                          )}
                        </strong>
                      </span>

                      {activity.buyer && (
                        <span>
                          Người mua:{" "}
                          <strong>
                            {shortAddress(
                              activity.buyer
                            )}
                          </strong>
                        </span>
                      )}

                    </div>

                  </div>

                  <div className="activity-right">

                    <span>
                      GIÁ
                    </span>

                    <strong>
                      {activity.price}
                      {" "}ETH
                    </strong>

                    <small>
                      Block #
                      {activity.blockNumber}
                    </small>

                    <small>
                      TX:{" "}
                      {activity.transactionHash
                        .slice(0, 8)}
                      ...
                      {activity.transactionHash
                        .slice(-6)}
                    </small>

                  </div>

                </div>

              );
            }
          )}

        </div>

      )}

    </main>
  );
}

export default Activity;