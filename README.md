# 🎮 Game Item Marketplace

Game Item Marketplace là ứng dụng phi tập trung (DApp) cho phép người dùng tạo, đăng bán, mua và quản lý các vật phẩm game dưới dạng NFT ERC-721.

Hệ thống sử dụng Smart Contract trên Ethereum, Hardhat làm môi trường blockchain local, MetaMask để kết nối ví, Express.js cho Backend API và React + TypeScript cho giao diện người dùng.

---

# 1. Chức năng chính

Hệ thống hiện hỗ trợ:

- Kết nối ví MetaMask
- Mint vật phẩm game thành NFT ERC-721
- Upload hình ảnh và metadata vật phẩm
- Đăng bán NFT lên Marketplace
- Mua NFT bằng ETH
- Hủy đăng bán
- Đăng bán lại NFT
- Xem các NFT đang sở hữu
- Xem chi tiết NFT
- Thêm NFT vào danh sách yêu thích
- Theo dõi lịch sử giao dịch
- Dashboard thống kê Marketplace
- Thông báo hoạt động Marketplace
- Theo dõi trạng thái giao dịch bằng Transaction Modal

---

# 2. Công nghệ sử dụng

## Blockchain

- Solidity
- Ethereum
- Hardhat 3
- ethers.js
- OpenZeppelin Contracts
- ERC-721
- MetaMask

## Backend

- Node.js
- Express.js
- Multer
- CORS
- JSON Storage

## Frontend

- React
- TypeScript
- Vite
- ethers.js
- React Router

---

# 3. Kiến trúc hệ thống

```text
┌───────────────────────────────┐
│           Người dùng          │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│       React + TypeScript      │
│           Frontend            │
└───────┬───────────────┬───────┘
        │               │
        │               │
        ▼               ▼
┌──────────────┐   ┌───────────────┐
│ Express API  │   │   MetaMask    │
│   Backend    │   │               │
└──────┬───────┘   └───────┬───────┘
       │                   │
       ▼                   ▼
┌──────────────┐   ┌──────────────────┐
│ Metadata +   │   │  Hardhat Local   │
│ Image Storage│   │    Blockchain    │
└──────────────┘   └────────┬─────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │ Smart Contracts  │
                   │                  │
                   │ GameItem.sol     │
                   │ Marketplace.sol  │
                   └──────────────────┘
```

---

# 4. Cấu trúc project

```text
GameItemMarketplace/
│
├── contracts/
│   ├── GameItem.sol
│   └── Marketplace.sol
│
├── scripts/
│   └── deploy.ts
│
├── test/
│
├── backend/
│   ├── data/
│   │   └── items.json
│   │
│   ├── routes/
│   │   └── items.js
│   │
│   ├── uploads/
│   │
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── blockchain/
│   │   │   └── contracts.ts
│   │   │
│   │   ├── components/
│   │   │   ├── ItemCard.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── NotificationBell.tsx
│   │   │   └── TransactionModal.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Marketplace.tsx
│   │   │   ├── MyItems.tsx
│   │   │   ├── SellItem.tsx
│   │   │   ├── ItemDetail.tsx
│   │   │   ├── Wishlist.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── Activity.tsx
│   │   │
│   │   ├── utils/
│   │   │   └── wishlist.ts
│   │   │
│   │   ├── App.tsx
│   │   └── App.css
│   │
│   └── package.json
│
├── hardhat.config.ts
├── package.json
└── README.md
```

---

# 5. Yêu cầu môi trường

Trước khi chạy project cần cài:

- Node.js 22.13.0 hoặc mới hơn
- npm
- MetaMask
- Visual Studio Code
- Git (khuyến nghị)

Kiểm tra Node.js:

```powershell
node -v
```

Kiểm tra npm:

```powershell
npm -v
```

Ví dụ môi trường đã sử dụng khi phát triển:

```text
Node.js: v22.13.0
npm: 10.9.2
```

---

# 6. Cài đặt project

Mở PowerShell tại thư mục:

```powershell
cd E:\NAM4\GameItemMarketplace
```

## 6.1. Cài dependencies cho Hardhat

```powershell
npm install
```

## 6.2. Cài dependencies cho Backend

```powershell
cd backend
npm install
cd ..
```

## 6.3. Cài dependencies cho Frontend

```powershell
cd frontend
npm install
cd ..
```

---

# 7. Compile Smart Contract

Tại thư mục gốc:

```powershell
cd E:\NAM4\GameItemMarketplace
```

Chạy:

```powershell
npx hardhat build
```

Nếu thành công sẽ xuất hiện thông báo compile thành công.

---

# 8. Khởi động Blockchain Local

Mở **Terminal 1**:

```powershell
cd E:\NAM4\GameItemMarketplace
```

Chạy:

```powershell
npx hardhat node
```

Hardhat sẽ tạo blockchain local tại:

```text
http://127.0.0.1:8545
```

Thông tin network:

```text
Network Name: Hardhat Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency Symbol: ETH
```

⚠️ Không đóng Terminal 1 trong quá trình chạy project.

---

# 9. Deploy Smart Contract

Sau khi Hardhat node đang chạy, mở **Terminal 2**.

```powershell
cd E:\NAM4\GameItemMarketplace
```

Chạy:

```powershell
npx hardhat run scripts/deploy.ts --network localhost
```

Sau khi deploy thành công terminal sẽ hiển thị địa chỉ:

```text
GameItem: 0x...
Marketplace: 0x...
```

Ví dụ trong một lần chạy:

```text
GameItem:
0x5FbDB2315678afecb367f032d93F642f64180aa3

Marketplace:
0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

---

# 10. Cập nhật địa chỉ Smart Contract

Sau khi deploy, mở:

```text
frontend/src/blockchain/contracts.ts
```

Cập nhật:

```ts
export const GAME_ITEM_ADDRESS =
  "DIA_CHI_GAME_ITEM";

export const MARKETPLACE_ADDRESS =
  "DIA_CHI_MARKETPLACE";
```

Ví dụ:

```ts
export const GAME_ITEM_ADDRESS =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const MARKETPLACE_ADDRESS =
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
```

Lưu file sau khi cập nhật.

---

# 11. Cấu hình MetaMask

Mở MetaMask và thêm mạng thủ công.

Nhập:

```text
Network Name:
Hardhat Local

RPC URL:
http://127.0.0.1:8545

Chain ID:
31337

Currency Symbol:
ETH
```

Sau đó chọn mạng:

```text
Hardhat Local
```

---

# 12. Thêm tài khoản Hardhat vào MetaMask

Khi chạy:

```powershell
npx hardhat node
```

Hardhat sẽ hiển thị các tài khoản test.

Có thể import một tài khoản test vào MetaMask để demo.

⚠️ Chỉ sử dụng các tài khoản test do Hardhat tạo cho blockchain local.

Không sử dụng private key của ví thật và không đăng private key lên GitHub.

---

# 13. Chạy Backend

Mở **Terminal 3**:

```powershell
cd E:\NAM4\GameItemMarketplace\backend
```

Chạy:

```powershell
node server.js
```

Nếu thành công:

```text
=================================
GAME ITEM MARKETPLACE API
=================================
Server: http://localhost:3000
API: http://localhost:3000/api/items
=================================
```

Có thể kiểm tra API bằng trình duyệt:

```text
http://localhost:3000
```

hoặc:

```text
http://localhost:3000/api/items
```

---

# 14. Chạy Frontend

Mở **Terminal 4**:

```powershell
cd E:\NAM4\GameItemMarketplace\frontend
```

Chạy:

```powershell
npm run dev
```

Vite sẽ hiển thị địa chỉ frontend, thường là:

```text
http://localhost:5173
```

Mở địa chỉ được Vite hiển thị trên trình duyệt.

---

# 15. Các Terminal cần giữ khi chạy project

Trong quá trình demo nên giữ các terminal:

```text
Terminal 1
Hardhat Blockchain
npx hardhat node


Terminal 2
Dùng để deploy hoặc chạy lệnh Hardhat


Terminal 3
Backend
node server.js


Terminal 4
Frontend
npm run dev
```

---

# 16. Quy trình chạy nhanh

Mỗi lần chuẩn bị demo project có thể thực hiện theo thứ tự:

```text
BƯỚC 1
Mở Hardhat Node

        ↓

BƯỚC 2
Deploy Smart Contract

        ↓

BƯỚC 3
Kiểm tra / cập nhật Contract Address

        ↓

BƯỚC 4
Chọn Hardhat Local trên MetaMask

        ↓

BƯỚC 5
Chạy Backend

        ↓

BƯỚC 6
Chạy Frontend

        ↓

BƯỚC 7
Kết nối MetaMask

        ↓

BƯỚC 8
Demo hệ thống
```

---

# 17. Quy trình demo chức năng

## 17.1. Kết nối ví

Nhấn:

```text
Kết nối ví
```

MetaMask sẽ yêu cầu kết nối tài khoản.

---

## 17.2. Tạo NFT

Vào:

```text
Đăng vật phẩm
```

Nhập:

- Tên vật phẩm
- Mô tả
- Danh mục
- Độ hiếm
- Giá bán
- Hình ảnh

Sau đó xác nhận các giao dịch MetaMask.

Quá trình gồm:

```text
Mint NFT
    ↓
Approve Marketplace
    ↓
List NFT
    ↓
Lưu Metadata
```

---

## 17.3. Xem Marketplace

Vào:

```text
Chợ vật phẩm
```

Các NFT đang được đăng bán sẽ được hiển thị.

Có thể:

- Xem hình ảnh
- Xem tên
- Xem độ hiếm
- Xem giá
- Xem người bán
- Xem chi tiết NFT
- Thêm vào yêu thích
- Mua NFT

---

## 17.4. Mua NFT

Để demo mua NFT nên sử dụng tài khoản MetaMask khác với tài khoản người bán.

Chọn:

```text
Mua ngay
```

Xác nhận giao dịch trong MetaMask.

Sau khi giao dịch thành công:

```text
NFT
Seller → Buyer

ETH
Buyer → Seller
```

---

## 17.5. Kho của tôi

Vào:

```text
Kho của tôi
```

Trang này hiển thị các NFT thuộc quyền sở hữu của tài khoản MetaMask hiện tại.

Người dùng có thể:

- Xem NFT
- Đăng bán NFT
- Đăng bán lại NFT
- Hủy đăng bán

---

## 17.6. Wishlist

Nhấn biểu tượng trái tim trên NFT để thêm vào:

```text
Yêu thích
```

Wishlist được lưu trên trình duyệt.

---

## 17.7. Dashboard

Trang:

```text
Dashboard
```

hiển thị thống kê hoạt động Marketplace, ví dụ:

- Tổng NFT
- Tổng listing
- Listing đang hoạt động
- NFT đã bán
- Listing đã hủy
- Khối lượng giao dịch

Dữ liệu blockchain được đọc từ các event của Smart Contract.

---

## 17.8. Lịch sử giao dịch

Trang:

```text
Lịch sử giao dịch
```

đọc các blockchain event:

```text
ItemListed
ItemSold
ListingCancelled
```

Người dùng có thể xem và lọc lịch sử hoạt động của Marketplace.

---

## 17.9. Notification

Biểu tượng thông báo trên Navbar hiển thị các hoạt động mới của Marketplace.

Ví dụ:

```text
NFT được đăng bán
NFT được mua
Listing bị hủy
```

---

# 18. Smart Contract

Project sử dụng hai Smart Contract chính.

## GameItem.sol

Quản lý NFT ERC-721.

Chức năng chính:

```text
mintItem()
ownerOf()
tokenURI()
approve()
setApprovalForAll()
```

Mỗi vật phẩm được biểu diễn bởi một:

```text
tokenId
```

duy nhất.

---

## Marketplace.sol

Quản lý hoạt động mua bán NFT.

Chức năng chính:

```text
listItem()
buyItem()
cancelListing()
listings()
listingCount()
```

Các event chính:

```text
ItemListed
ItemSold
ListingCancelled
```

---

# 19. Backend API

Backend mặc định chạy tại:

```text
http://localhost:3000
```

API vật phẩm:

```text
GET /api/items
```

Lấy danh sách metadata NFT.

```text
GET /api/items/token/:tokenId
```

Lấy metadata theo Token ID.

```text
POST /api/items
```

Lưu metadata và hình ảnh vật phẩm.

Backend sử dụng:

```text
backend/data/items.json
```

để lưu metadata.

Hình ảnh được lưu tại:

```text
backend/uploads/
```

---

# 20. Dữ liệu On-chain và Off-chain

Hệ thống chia dữ liệu thành hai nhóm.

## On-chain

Lưu trên blockchain:

```text
NFT Ownership
Token ID
Token URI
Listing
Seller
Price
Trạng thái Listing
Blockchain Events
```

## Off-chain

Lưu tại Backend:

```text
Tên vật phẩm
Mô tả
Category
Rarity
Image
Metadata
```

Cách thiết kế này giúp Smart Contract tập trung vào quyền sở hữu và giao dịch, trong khi dữ liệu giao diện được Backend quản lý.

---

# 21. Lưu ý quan trọng về Hardhat Local

Hardhat Local Blockchain chỉ tồn tại trong thời gian node đang chạy.

Khi dừng:

```powershell
npx hardhat node
```

và khởi động lại, blockchain local sẽ được tạo lại từ đầu.

Điều đó có nghĩa:

```text
NFT cũ → không còn trên blockchain mới

Listing cũ → không còn

Transaction cũ → không còn

Contract cũ → không còn
```

Do đó sau khi restart Hardhat node cần:

```text
1. Deploy lại Smart Contract

2. Kiểm tra địa chỉ Contract mới

3. Cập nhật contracts.ts nếu địa chỉ thay đổi

4. Kiểm tra MetaMask đang ở Chain ID 31337

5. Reload Frontend
```

Metadata trong:

```text
backend/data/items.json
```

không tự động bị xóa khi Hardhat node restart.

Vì vậy dữ liệu Backend và Blockchain local có thể không còn đồng bộ sau khi reset blockchain.

---

# 22. Lỗi thường gặp

## MetaMask sai network

Kiểm tra MetaMask đang sử dụng:

```text
Chain ID: 31337
```

---

## Frontend không kết nối được Smart Contract

Kiểm tra:

```text
npx hardhat node
```

đang chạy.

Sau đó kiểm tra địa chỉ trong:

```text
frontend/src/blockchain/contracts.ts
```

---

## Contract address sai

Deploy lại:

```powershell
npx hardhat run scripts/deploy.ts --network localhost
```

Copy địa chỉ mới vào:

```text
frontend/src/blockchain/contracts.ts
```

---

## Backend không hoạt động

Chạy:

```powershell
cd backend
node server.js
```

Kiểm tra:

```text
http://localhost:3000/api/items
```

---

## Frontend không hoạt động

Chạy:

```powershell
cd frontend
npm install
npm run dev
```

---

## Port đang được sử dụng

Các port chính:

```text
8545 → Hardhat

3000 → Backend

5173 → Frontend Vite
```

Nếu một port đã được chương trình khác sử dụng, cần đóng chương trình đó hoặc sử dụng port khác.

---

# 23. Build Frontend

Để kiểm tra frontend có build thành công hay không:

```powershell
cd frontend
npm run build
```

Nếu thành công, Vite sẽ tạo thư mục:

```text
dist/
```

---

# 24. Kiểm tra trước khi báo cáo / demo

Trước khi báo cáo nên kiểm tra:

```text
[ ] Hardhat node đang chạy

[ ] Smart Contract đã deploy

[ ] contracts.ts đúng địa chỉ

[ ] MetaMask ở Chain ID 31337

[ ] MetaMask đã kết nối

[ ] Backend chạy port 3000

[ ] Frontend chạy thành công

[ ] Marketplace load được NFT

[ ] Mint NFT hoạt động

[ ] Đăng bán hoạt động

[ ] Mua NFT hoạt động

[ ] Hủy listing hoạt động

[ ] Kho của tôi hoạt động

[ ] Wishlist hoạt động

[ ] Dashboard hoạt động

[ ] Lịch sử giao dịch hoạt động

[ ] Notification hoạt động
```

---

# 25. Quy trình demo đề xuất

Có thể demo theo trình tự:

```text
1. Giới thiệu trang Marketplace

2. Kết nối MetaMask

3. Tạo một NFT mới

4. Đăng NFT lên Marketplace

5. Mở trang chi tiết NFT

6. Thêm NFT vào Wishlist

7. Chuyển sang tài khoản Buyer

8. Mua NFT

9. Kiểm tra NFT trong "Kho của tôi"

10. Kiểm tra lịch sử giao dịch

11. Kiểm tra Dashboard

12. Kiểm tra Notification
```

Quy trình này thể hiện được toàn bộ luồng chính:

```text
Create
   ↓
Mint
   ↓
Approve
   ↓
List
   ↓
Buy
   ↓
Transfer Ownership
   ↓
Blockchain Event
   ↓
Dashboard / History / Notification
```

---

# 26. Hạn chế hiện tại

Phiên bản hiện tại sử dụng:

```text
Hardhat Local Blockchain
```

nên dữ liệu blockchain sẽ reset khi node bị khởi động lại.

Backend hiện sử dụng JSON Storage, phù hợp cho mục đích học tập và demo.

Trong phiên bản phát triển tiếp theo có thể mở rộng:

- Deploy lên Ethereum Testnet
- Sử dụng database
- IPFS cho NFT metadata
- Phân trang Marketplace
- Tìm kiếm nâng cao
- Quản lý profile người dùng
- Phí giao dịch Marketplace
- Kiểm thử Smart Contract đầy đủ hơn

---

# 27. Mục đích

Project được xây dựng phục vụ mục đích học tập và thực hành phát triển ứng dụng phi tập trung (DApp), Smart Contract và công nghệ Blockchain.