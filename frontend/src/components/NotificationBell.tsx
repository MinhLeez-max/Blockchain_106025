import {
  useEffect,
  useRef,
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

import {
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI
} from "../blockchain/contracts";


type NotificationType =
  | "listed"
  | "sold"
  | "cancelled";


type NotificationItem = {
  id: string;
  type: NotificationType;
  listingId: number;
  tokenId: number;
  price: string;
  message: string;
  blockNumber: number;
};


type ListingData = {
  tokenId: number;
  price: bigint;
};


const READ_KEY =
  "game-market-read-notifications";


function getReadNotifications():
  string[] {

  try {

    const data =
      localStorage.getItem(
        READ_KEY
      );

    if (!data) {
      return [];
    }

    const parsed =
      JSON.parse(data);

    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch {

    return [];

  }

}


function NotificationBell() {

  const [
    notifications,
    setNotifications
  ] =
    useState<NotificationItem[]>([]);


  const [
    open,
    setOpen
  ] =
    useState(false);


  const [
    readIds,
    setReadIds
  ] =
    useState<string[]>(
      getReadNotifications()
    );


  const [
    loading,
    setLoading
  ] =
    useState(false);


  const wrapperRef =
    useRef<HTMLDivElement>(
      null
    );


  // =====================================
  // LOAD BLOCKCHAIN EVENTS
  // =====================================

  const loadNotifications =
    async () => {

      try {

        if (!window.ethereum) {
          return;
        }

        setLoading(true);


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


          listingMap.set(
            listingId,
            {
              tokenId:
                Number(
                  event.args[3]
                ),

              price:
                event.args[4] as bigint
            }
          );

        }


        const result:
          NotificationItem[] = [];


        // =================================
        // LISTED
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


          result.push({
            id:
              `listed-${event.transactionHash}-${event.index}`,

            type:
              "listed",

            listingId,

            tokenId:
              listing.tokenId,

            price:
              formatEther(
                listing.price
              ),

            message:
              `Token #${listing.tokenId} vừa được đăng bán`,

            blockNumber:
              event.blockNumber
          });

        }


        // =================================
        // SOLD
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


          const listing =
            listingMap.get(
              listingId
            );


          if (!listing) {
            continue;
          }


          result.push({
            id:
              `sold-${event.transactionHash}-${event.index}`,

            type:
              "sold",

            listingId,

            tokenId:
              listing.tokenId,

            price:
              formatEther(
                listing.price
              ),

            message:
              `Token #${listing.tokenId} đã được mua`,

            blockNumber:
              event.blockNumber
          });

        }


        // =================================
        // CANCELLED
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


          result.push({
            id:
              `cancelled-${event.transactionHash}-${event.index}`,

            type:
              "cancelled",

            listingId,

            tokenId:
              listing.tokenId,

            price:
              formatEther(
                listing.price
              ),

            message:
              `Token #${listing.tokenId} đã hủy đăng bán`,

            blockNumber:
              event.blockNumber
          });

        }


        // =================================
        // SORT
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


        // Chỉ hiện 15 thông báo gần nhất
        setNotifications(
          result.slice(
            0,
            15
          )
        );


      } catch (error) {

        console.error(
          "Lỗi tải thông báo:",
          error
        );


      } finally {

        setLoading(false);

      }

    };


  // =====================================
  // LOAD LẦN ĐẦU
  // =====================================

  useEffect(() => {

    loadNotifications();

  }, []);


  // =====================================
  // TỰ CẬP NHẬT
  // =====================================

  useEffect(() => {

    const interval =
      window.setInterval(
        () => {
          loadNotifications();
        },
        5000
      );


    return () => {

      window.clearInterval(
        interval
      );

    };

  }, []);


  // =====================================
  // CLICK RA NGOÀI
  // =====================================

  useEffect(() => {

    const handleClickOutside =
      (
        event: MouseEvent
      ) => {

        if (
          wrapperRef.current &&
          !wrapperRef.current.contains(
            event.target as Node
          )
        ) {

          setOpen(false);

        }

      };


    document.addEventListener(
      "mousedown",
      handleClickOutside
    );


    return () => {

      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

    };

  }, []);


  // =====================================
  // UNREAD
  // =====================================

  const unreadCount =
    notifications.filter(
      (item) =>
        !readIds.includes(
          item.id
        )
    ).length;


  // =====================================
  // MARK ONE
  // =====================================

  const markAsRead =
    (
      id: string
    ) => {

      if (
        readIds.includes(id)
      ) {
        return;
      }


      const updated = [
        ...readIds,
        id
      ];


      setReadIds(
        updated
      );


      localStorage.setItem(
        READ_KEY,
        JSON.stringify(
          updated
        )
      );

    };


  // =====================================
  // MARK ALL
  // =====================================

  const markAllAsRead =
    () => {

      const ids =
        notifications.map(
          (item) =>
            item.id
        );


      const updated =
        Array.from(
          new Set([
            ...readIds,
            ...ids
          ])
        );


      setReadIds(
        updated
      );


      localStorage.setItem(
        READ_KEY,
        JSON.stringify(
          updated
        )
      );

    };


  // =====================================
  // ICON
  // =====================================

  const getIcon =
    (
      type:
        NotificationType
    ) => {

      if (
        type === "listed"
      ) {
        return "🏷️";
      }


      if (
        type === "sold"
      ) {
        return "🛒";
      }


      return "❌";

    };


  return (

    <div
      className="notification-wrapper"
      ref={wrapperRef}
    >

      {/* ================================= */}
      {/* BELL */}
      {/* ================================= */}

      <button
        type="button"
        className="notification-bell"
        onClick={() => {

          setOpen(
            !open
          );

          if (!open) {
            loadNotifications();
          }

        }}
        title="Thông báo"
      >

        🔔

        {unreadCount > 0 && (

          <span className="notification-badge">

            {unreadCount > 99
              ? "99+"
              : unreadCount
            }

          </span>

        )}

      </button>


      {/* ================================= */}
      {/* DROPDOWN */}
      {/* ================================= */}

      {open && (

        <div className="notification-dropdown">


          <div className="notification-header">

            <div>

              <h3>
                Thông báo
              </h3>

              <span>
                {unreadCount} chưa đọc
              </span>

            </div>


            {unreadCount > 0 && (

              <button
                type="button"
                onClick={
                  markAllAsRead
                }
              >
                Đọc tất cả
              </button>

            )}

          </div>


          <div className="notification-list">


            {loading &&
            notifications.length ===
              0 ? (

              <div className="notification-empty">

                Đang đọc blockchain...

              </div>

            ) : notifications.length ===
              0 ? (

              <div className="notification-empty">

                🔕 Chưa có thông báo

              </div>

            ) : (

              notifications.map(
                (item) => {

                  const unread =
                    !readIds.includes(
                      item.id
                    );


                  return (

                    <Link
                      to={`/item/${item.tokenId}`}
                      className={
                        unread
                          ? "notification-item unread"
                          : "notification-item"
                      }
                      key={
                        item.id
                      }
                      onClick={() => {

                        markAsRead(
                          item.id
                        );

                        setOpen(
                          false
                        );

                      }}
                    >

                      <div className="notification-icon">

                        {getIcon(
                          item.type
                        )}

                      </div>


                      <div className="notification-content">

                        <strong>
                          {item.message}
                        </strong>

                        <span>
                          {item.price} ETH
                          {" • "}
                          Listing #
                          {item.listingId}
                        </span>

                        <small>
                          Block #
                          {item.blockNumber}
                        </small>

                      </div>


                      {unread && (

                        <span className="notification-dot" />

                      )}

                    </Link>

                  );

                }
              )

            )}


          </div>


          <div className="notification-footer">

            <Link
              to="/activity"
              onClick={() =>
                setOpen(false)
              }
            >
              Xem lịch sử giao dịch →
            </Link>

          </div>


        </div>

      )}

    </div>

  );

}


export default NotificationBell;