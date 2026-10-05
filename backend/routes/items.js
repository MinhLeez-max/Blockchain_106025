const express =
  require("express");

const multer =
  require("multer");

const path =
  require("path");

const fs =
  require("fs");

const router =
  express.Router();


// ==========================================
// ĐƯỜNG DẪN DATA
// ==========================================

const dataDirectory =
  path.join(
    __dirname,
    "../data"
  );

const dataFile =
  path.join(
    dataDirectory,
    "items.json"
  );


// ==========================================
// TẠO DATA NẾU CHƯA CÓ
// ==========================================

if (
  !fs.existsSync(
    dataDirectory
  )
) {
  fs.mkdirSync(
    dataDirectory,
    {
      recursive: true
    }
  );
}

if (
  !fs.existsSync(
    dataFile
  )
) {
  fs.writeFileSync(
    dataFile,
    "[]",
    "utf8"
  );
}


// ==========================================
// ĐỌC ITEMS
// ==========================================

function loadItems() {

  try {

    const data =
      fs.readFileSync(
        dataFile,
        "utf8"
      );

    if (!data.trim()) {
      return [];
    }

    return JSON.parse(
      data
    );

  } catch (error) {

    console.error(
      "Lỗi đọc items.json:",
      error
    );

    return [];
  }
}


// ==========================================
// LƯU ITEMS
// ==========================================

function saveItems(
  items
) {

  fs.writeFileSync(
    dataFile,
    JSON.stringify(
      items,
      null,
      2
    ),
    "utf8"
  );
}


// ==========================================
// MULTER
// ==========================================

const storage =
  multer.diskStorage({

    destination:
      function (
        req,
        file,
        cb
      ) {

        const uploadDirectory =
          path.join(
            __dirname,
            "../uploads"
          );

        if (
          !fs.existsSync(
            uploadDirectory
          )
        ) {
          fs.mkdirSync(
            uploadDirectory,
            {
              recursive: true
            }
          );
        }

        cb(
          null,
          uploadDirectory
        );
      },

    filename:
      function (
        req,
        file,
        cb
      ) {

        const uniqueName =
          Date.now() +
          "-" +
          Math.round(
            Math.random() *
            1e9
          );

        cb(
          null,
          uniqueName +
          path.extname(
            file.originalname
          )
        );
      }
  });


const upload =
  multer({
    storage,

    limits: {
      fileSize:
        5 * 1024 * 1024
    },

    fileFilter:
      (
        req,
        file,
        cb
      ) => {

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

          cb(
            null,
            true
          );

        } else {

          cb(
            new Error(
              "Chỉ chấp nhận JPG, PNG hoặc WEBP."
            )
          );
        }
      }
  });


// ==========================================
// GET ALL ITEMS
// ==========================================

router.get(
  "/",
  (
    req,
    res
  ) => {

    const items =
      loadItems();

    res.json(
      items
    );
  }
);


// ==========================================
// GET ITEM THEO TOKEN ID
// ==========================================

router.get(
  "/token/:tokenId",
  (
    req,
    res
  ) => {

    const items =
      loadItems();

    const tokenId =
      Number(
        req.params.tokenId
      );

    const item =
      items.find(
        (item) =>
          Number(
            item.tokenId
          ) === tokenId
      );

    if (!item) {

      return res
        .status(404)
        .json({
          message:
            "Không tìm thấy vật phẩm."
        });
    }

    res.json(
      item
    );
  }
);


// ==========================================
// POST - TẠO ITEM
// ==========================================

router.post(
  "/",
  upload.single(
    "image"
  ),

  (
    req,
    res
  ) => {

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


      // ====================================
      // VALIDATE
      // ====================================

      if (
        !name ||
        !description ||
        !category ||
        !rarity ||
        !price ||
        !tokenId ||
        !seller
      ) {

        if (
          req.file
        ) {
          fs.unlinkSync(
            req.file.path
          );
        }

        return res
          .status(400)
          .json({
            message:
              "Thiếu thông tin vật phẩm."
          });
      }


      if (!req.file) {

        return res
          .status(400)
          .json({
            message:
              "Vui lòng chọn hình ảnh."
          });
      }


      const items =
        loadItems();


      // ====================================
      // TOKEN ĐÃ TỒN TẠI?
      // ====================================

      const existingItem =
        items.find(
          (item) =>
            Number(
              item.tokenId
            ) ===
            Number(
              tokenId
            )
        );


      if (
        existingItem
      ) {

        fs.unlinkSync(
          req.file.path
        );

        return res
          .status(409)
          .json({
            message:
              `Token #${tokenId} đã tồn tại.`
          });
      }


      // ====================================
      // ITEM MỚI
      // ====================================

      const newItem = {

        id:
          Date.now(),

        name,

        description,

        category,

        rarity,

        price:
          Number(
            price
          ),

        tokenId:
          Number(
            tokenId
          ),

        seller,

        image:
          `http://localhost:3000/uploads/${req.file.filename}`,

        createdAt:
          new Date()
            .toISOString()
      };


      items.push(
        newItem
      );


      // ====================================
      // GHI RA FILE
      // ====================================

      saveItems(
        items
      );


      console.log(
        `Đã lưu Token #${newItem.tokenId} vào items.json`
      );


      res
        .status(201)
        .json(
          newItem
        );

    } catch (error) {

      console.error(
        "Lỗi tạo vật phẩm:",
        error
      );

      res
        .status(500)
        .json({
          message:
            "Không thể tạo vật phẩm."
        });
    }
  }
);


// ==========================================
// DELETE ITEM
// ==========================================

router.delete(
  "/:id",
  (
    req,
    res
  ) => {

    try {

      const id =
        Number(
          req.params.id
        );

      let items =
        loadItems();

      const item =
        items.find(
          (item) =>
            Number(
              item.id
            ) === id
        );


      if (!item) {

        return res
          .status(404)
          .json({
            message:
              "Không tìm thấy vật phẩm."
          });
      }


      items =
        items.filter(
          (item) =>
            Number(
              item.id
            ) !== id
        );


      saveItems(
        items
      );


      // ====================================
      // XÓA ẢNH
      // ====================================

      if (
        item.image
      ) {

        try {

          const filename =
            path.basename(
              item.image
            );

          const imagePath =
            path.join(
              __dirname,
              "../uploads",
              filename
            );


          if (
            fs.existsSync(
              imagePath
            )
          ) {

            fs.unlinkSync(
              imagePath
            );
          }

        } catch (
          imageError
        ) {

          console.error(
            "Không thể xóa ảnh:",
            imageError
          );

        }
      }


      res.json({
        message:
          "Đã xóa vật phẩm."
      });

    } catch (error) {

      console.error(
        "Lỗi xóa vật phẩm:",
        error
      );

      res
        .status(500)
        .json({
          message:
            "Không thể xóa vật phẩm."
        });
    }
  }
);


// ==========================================
// MULTER ERROR
// ==========================================

router.use(
  (
    error,
    req,
    res,
    next
  ) => {

    if (
      error instanceof
      multer.MulterError
    ) {

      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {

        return res
          .status(400)
          .json({
            message:
              "Ảnh không được vượt quá 5 MB."
          });
      }
    }


    if (error) {

      return res
        .status(400)
        .json({
          message:
            error.message
        });
    }


    next();
  }
);


module.exports =
  router;