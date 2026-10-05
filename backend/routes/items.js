const express = require("express");
const router = express.Router();

let items = [
  {
    id: 1,
    name: "Dragon Sword",
    description: "Legendary sword forged with dragon fire.",
    category: "Weapon",
    rarity: "Legendary",
    price: "1",
    image: "/items/dragon-sword.png",
    tokenId: 1,
    listingId: 2
  },
  {
    id: 2,
    name: "Shadow Dagger",
    description: "A silent blade used by shadow assassins.",
    category: "Weapon",
    rarity: "Epic",
    price: "0.45",
    image: "/items/shadow-dagger.png",
    tokenId: 2,
    listingId: 3
  },
  {
    id: 3,
    name: "Frost Bow",
    description: "An ancient bow powered by frozen energy.",
    category: "Weapon",
    rarity: "Rare",
    price: "0.6",
    image: "/items/frost-bow.png",
    tokenId: 3,
    listingId: 4
  },
  {
    id: 4,
    name: "Magic Shield",
    description: "A magical shield with powerful protection.",
    category: "Armor",
    rarity: "Rare",
    price: "0.5",
    image: "/items/magic-shield.png",
    tokenId: 4,
    listingId: 5
  },
  {
    id: 5,
    name: "Dark Knight Armor",
    description: "Heavy armor forged for elite warriors.",
    category: "Armor",
    rarity: "Legendary",
    price: "1.2",
    image: "/items/dark-knight-armor.png",
    tokenId: 5,
    listingId: 6
  },
  {
    id: 6,
    name: "Dragon Helmet",
    description: "Helmet crafted from legendary dragon scales.",
    category: "Armor",
    rarity: "Epic",
    price: "0.75",
    image: "/items/dragon-helmet.png",
    tokenId: 6,
    listingId: 7
  },
  {
    id: 7,
    name: "Neon Rifle Skin",
    description: "Cyberpunk neon skin for futuristic rifles.",
    category: "Skin",
    rarity: "Epic",
    price: "0.35",
    image: "/items/neon-rifle.png",
    tokenId: 7,
    listingId: 8
  },
  {
    id: 8,
    name: "Golden Rifle Skin",
    description: "Premium golden weapon skin for collectors.",
    category: "Skin",
    rarity: "Legendary",
    price: "0.9",
    image: "/items/golden-rifle.png",
    tokenId: 8,
    listingId: 9
  },
  {
    id: 9,
    name: "Cyber Blade",
    description: "High-tech energy blade from the cyber arena.",
    category: "Weapon",
    rarity: "Rare",
    price: "0.55",
    image: "/items/cyber-blade.png",
    tokenId: 9,
    listingId: 10
  }
];

// GET tất cả vật phẩm
router.get("/", (req, res) => {
  res.json(items);
});

// GET vật phẩm theo ID
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);

  const item = items.find(
    (item) => item.id === id
  );

  if (!item) {
    return res.status(404).json({
      message: "Item not found"
    });
  }

  res.json(item);
});

// POST thêm vật phẩm
router.post("/", (req, res) => {
  const newId =
    items.length > 0
      ? Math.max(...items.map((item) => item.id)) + 1
      : 1;

  const item = {
    id: newId,
    ...req.body
  };

  items.push(item);

  res.status(201).json(item);
});

// DELETE vật phẩm
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);

  const item = items.find(
    (item) => item.id === id
  );

  if (!item) {
    return res.status(404).json({
      message: "Item not found"
    });
  }

  items = items.filter(
    (item) => item.id !== id
  );

  res.json({
    message: "Item deleted"
  });
});

module.exports = router;