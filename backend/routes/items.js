const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// =====================================
// THƯ MỤC UPLOAD
// =====================================

const uploadDirectory = path.join(
  __dirname,
  "../uploads"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true
  });
}

// =====================================
// CẤU HÌNH UPLOAD ẢNH
// =====================================

const storage = multer.diskStorage({
  destination: function (
    req,
    file,
    cb
  ) {
    cb(null, uploadDirectory);
  },

  filename: function (
    req,
    file,
    cb
  ) {
    const extension =
      path.extname(file.originalname);

    const uniqueName =
      Date.now() +
      "-" +
      Math.round(
        Math.random() * 1e9
      ) +
      extension;

    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: function (
    req,
    file,
    cb
  ) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (
      allowedTypes.includes(
        file.mimetype
      )
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Chỉ cho phép ảnh JPG, PNG hoặc WEBP"
        )
      );
    }
  }
});

// =====================================
// DỮ LIỆU ĐỘNG
// =====================================

// Không còn 9 vật phẩm mẫu.
// Vật phẩm sẽ được thêm khi người dùng
// tạo NFT và đăng bán trên giao diện.

let items = [];

// =====================================
// GET TẤT CẢ VẬT PHẨM
// =====================================

router.get("/", (req, res) => {
  res.json(items);
});

// =====================================
// GET VẬT PHẨM THEO ID
// =====================================

router.get("/:id", (req, res) => {
  const id = Number(req.params.id);

  const item = items.find(
    (item) => item.id === id
  );

  if (!item) {
    return res.status(404).json({
      message:
        "Không tìm thấy vật phẩm"
    });
  }

  res.json(item);
});

// =====================================
// TẠO VẬT PHẨM
// =====================================

router.post(
  "/",
  upload.single("image"),
  (req, res) => {
    try {
      const {
        name,
        description,
        category,
        rarity,
        price,
        tokenId,
        seller
      } = req.body;

      // =================================
      // VALIDATE
      // =================================

      if (
        !name ||
        !description ||
        !category ||
        !rarity ||
        !price ||
        !tokenId ||
        !seller
      ) {
        return res.status(400).json({
          message:
            "Vui lòng nhập đầy đủ thông tin"
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message:
            "Vui lòng chọn hình ảnh vật phẩm"
        });
      }

      // Không cho metadata trùng token
      const existingToken =
        items.find(
          (item) =>
            item.tokenId ===
            Number(tokenId)
        );

      if (existingToken) {
        return res.status(409).json({
          message:
            `Token #${tokenId} đã tồn tại`
        });
      }

      // =================================
      // TẠO ID BACKEND
      // =================================

      const newId =
        items.length > 0
          ? Math.max(
              ...items.map(
                (item) => item.id
              )
            ) + 1
          : 1;

      // =================================
      // URL ẢNH
      // =================================

      const imageUrl =
        `http://localhost:3000/uploads/${req.file.filename}`;

      // =================================
      // VẬT PHẨM MỚI
      // =================================

      const newItem = {
        id: newId,

        name:
          name.trim(),

        description:
          description.trim(),

        category,

        rarity,

        price,

        image:
          imageUrl,

        tokenId:
          Number(tokenId),

        seller
      };

      items.push(newItem);

      console.log("");
      console.log(
        "=============================="
      );

      console.log(
        "VẬT PHẨM MỚI"
      );

      console.log(
        "=============================="
      );

      console.log(
        "Tên:",
        newItem.name
      );

      console.log(
        "Token:",
        newItem.tokenId
      );

      console.log(
        "Người bán:",
        newItem.seller
      );

      console.log(
        "Giá:",
        newItem.price,
        "ETH"
      );

      res
        .status(201)
        .json(newItem);

    } catch (error) {
      console.error(
        "Lỗi tạo vật phẩm:",
        error
      );

      res.status(500).json({
        message:
          "Không thể tạo vật phẩm"
      });
    }
  }
);

// =====================================
// DELETE
// =====================================

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);

  const item = items.find(
    (item) => item.id === id
  );

  if (!item) {
    return res.status(404).json({
      message:
        "Không tìm thấy vật phẩm"
    });
  }

  items = items.filter(
    (item) => item.id !== id
  );

  res.json({
    message:
      "Đã xóa vật phẩm"
  });
});

// =====================================
// XỬ LÝ LỖI UPLOAD
// =====================================

router.use(
  (error, req, res, next) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      return res.status(400).json({
        message:
          error.code ===
          "LIMIT_FILE_SIZE"
            ? "Ảnh không được vượt quá 5 MB"
            : error.message
      });
    }

    if (error) {
      return res.status(400).json({
        message: error.message
      });
    }

    next();
  }
);

module.exports = router;