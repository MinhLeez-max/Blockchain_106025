const express = require("express");
const cors = require("cors");
const path = require("path");

const itemRoutes =
  require("./routes/items");

const app = express();

// =====================================
// MIDDLEWARE
// =====================================

app.use(cors());

app.use(
  express.json()
);

// Cho phép frontend truy cập ảnh
app.use(
  "/uploads",
  express.static(
    path.join(
      __dirname,
      "uploads"
    )
  )
);

// =====================================
// API
// =====================================

app.use(
  "/api/items",
  itemRoutes
);

// =====================================
// TEST API
// =====================================

app.get("/", (req, res) => {
  res.json({
    message:
      "Game Item Marketplace API đang hoạt động"
  });
});

// =====================================
// START SERVER
// =====================================

const PORT = 3000;

app.listen(
  PORT,
  () => {
    console.log(
      "================================="
    );

    console.log(
      "GAME ITEM MARKETPLACE API"
    );

    console.log(
      "================================="
    );

    console.log(
      `Server: http://localhost:${PORT}`
    );

    console.log(
      `API: http://localhost:${PORT}/api/items`
    );

    console.log(
      "================================="
    );
  }
);