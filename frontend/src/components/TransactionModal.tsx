type ModalType =
  | "confirm"
  | "loading"
  | "success"
  | "error";


type Props = {
  open: boolean;
  type: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onClose?: () => void;
};


function TransactionModal({
  open,
  type,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onConfirm,
  onClose
}: Props) {

  if (!open) {
    return null;
  }


  const getIcon =
    () => {

      if (type === "success") {
        return "✅";
      }

      if (type === "error") {
        return "❌";
      }

      if (type === "loading") {
        return "⏳";
      }

      return "🛒";

    };


  return (

    <div className="transaction-modal-overlay">

      <div className="transaction-modal">

        <div
          className={
            type === "loading"
              ? "transaction-modal-icon loading"
              : "transaction-modal-icon"
          }
        >
          {getIcon()}
        </div>


        <h2>
          {title}
        </h2>


        <p>
          {message}
        </p>


        {type === "confirm" && (

          <div className="transaction-modal-actions">

            <button
              type="button"
              className="modal-cancel-button"
              onClick={onClose}
            >
              {cancelText}
            </button>


            <button
              type="button"
              className="modal-confirm-button"
              onClick={onConfirm}
            >
              {confirmText}
            </button>

          </div>

        )}


        {(
          type === "success" ||
          type === "error"
        ) && (

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
          >
            Đóng
          </button>

        )}


        {type === "loading" && (

          <div className="modal-loading-text">
            Không đóng cửa sổ hoặc làm mới trang.
          </div>

        )}

      </div>

    </div>

  );

}


export default TransactionModal;