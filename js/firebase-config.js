/**
 * firebase-config.js — SuperMall v2
 * Replace firebaseConfig with your real Firebase credentials.
 * Demo mode uses localStorage with rich seed data including real images.
 */

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

let db = null, auth = null, DEMO_MODE = false;

try {
  firebase.initializeApp(firebaseConfig);
  db   = firebase.firestore();
  auth = firebase.auth();
  Logger.info("firebase", "✅ Connected to supermall-3663d");
} catch (e) {
  DEMO_MODE = true;
  Logger.warn("firebase", "⚠️ Demo Mode active", e.message);
}

// ── MockDB ─────────────────────────────────────────────────────
const MockDB = {
  _read(c)  { try { return JSON.parse(localStorage.getItem(`sm_${c}`) || "[]"); } catch { return []; } },
  _write(c, d) { localStorage.setItem(`sm_${c}`, JSON.stringify(d)); },
  async getAll(c)       { return this._read(c); },
  async getById(c, id)  { return this._read(c).find(d => d.id === id) || null; },
  async add(c, data) {
    const items = this._read(c);
    const doc = { ...data, id: "id_" + Date.now() + "_" + Math.random().toString(36).slice(2,6), createdAt: new Date().toISOString() };
    items.push(doc); this._write(c, items); return doc;
  },
  async update(c, id, data) {
    const items = this._read(c), idx = items.findIndex(d => d.id === id);
    if (idx === -1) throw new Error("Not found");
    items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
    this._write(c, items); return items[idx];
  },
  async delete(c, id) { this._write(c, this._read(c).filter(d => d.id !== id)); },
  async query(c, field, op, val) {
    return this._read(c).filter(item => op === "==" ? item[field] === val : item[field] !== val);
  }
};

// ── Seed rich demo data ────────────────────────────────────────
(function seed() {
  if (!DEMO_MODE || localStorage.getItem("sm_seeded_v2")) return;

  // Real product images from Unsplash (free-to-use URLs)
  const categories = [
    { id:"cat_1", name:"Electronics",      icon:"💻", floor:"Floor 1", color:"#dbeafe" },
    { id:"cat_2", name:"Fashion",          icon:"👗", floor:"Floor 2", color:"#fce7f3" },
    { id:"cat_3", name:"Food & Beverages", icon:"🍔", floor:"Ground",  color:"#fef3c7" },
    { id:"cat_4", name:"Toys & Games",     icon:"🎮", floor:"Floor 3", color:"#d1fae5" },
    { id:"cat_5", name:"Sports & Fitness", icon:"⚽", floor:"Floor 2", color:"#ede9fe" },
    { id:"cat_6", name:"Beauty & Health",  icon:"💄", floor:"Floor 1", color:"#ffe4e6" }
  ];

  const shops = [
    { id:"sh_1", name:"TechZone",      category:"Electronics",      floor:"Floor 1", unit:"A-101", owner:"admin@mall.com", description:"Latest gadgets, laptops, phones & accessories. Authorised dealer for all major brands.", phone:"9876543210", open:"10:00", close:"22:00", active:true,  rating:4.5, reviewCount:128, image:"https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&q=80", tags:["Electronics","Gadgets","Mobiles"] },
    { id:"sh_2", name:"StyleHub",      category:"Fashion",          floor:"Floor 2", unit:"B-204", owner:"admin@mall.com", description:"Trendy fashion for all ages — western, ethnic & fusion wear. New arrivals every week.", phone:"9876543211", open:"10:00", close:"21:00", active:true,  rating:4.2, reviewCount:94,  image:"https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=400&q=80", tags:["Fashion","Clothing","Accessories"] },
    { id:"sh_3", name:"Food Court",    category:"Food & Beverages", floor:"Ground",  unit:"G-01",  owner:"admin@mall.com", description:"Multi-cuisine food court with 12 live counters. Pizzas, Chinese, Indian & more.", phone:"9876543212", open:"09:00", close:"23:00", active:true,  rating:4.7, reviewCount:312, image:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80", tags:["Food","Beverages","Restaurant"] },
    { id:"sh_4", name:"GameWorld",     category:"Toys & Games",     floor:"Floor 3", unit:"C-305", owner:"admin@mall.com", description:"Gaming consoles, accessories & collectibles. Experience zone with 20+ demo stations.", phone:"9876543213", open:"11:00", close:"21:00", active:true,  rating:4.4, reviewCount:76,  image:"https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&q=80", tags:["Gaming","Toys","Consoles"] },
    { id:"sh_5", name:"FitLife",       category:"Sports & Fitness", floor:"Floor 2", unit:"B-110", owner:"admin@mall.com", description:"Premium sports gear, gym equipment & activewear from top brands.", phone:"9876543214", open:"09:00", close:"21:00", active:true,  rating:4.3, reviewCount:55,  image:"https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80", tags:["Sports","Fitness","Gym"] },
    { id:"sh_6", name:"GlowUp",        category:"Beauty & Health",  floor:"Floor 1", unit:"A-205", owner:"admin@mall.com", description:"Skincare, makeup, haircare & wellness products. Luxury & budget-friendly options.", phone:"9876543215", open:"10:00", close:"21:00", active:true,  rating:4.6, reviewCount:143, image:"https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80", tags:["Beauty","Skincare","Health"] },
    { id:"sh_7", name:"BookNook",      category:"Electronics",      floor:"Floor 1", unit:"A-102", owner:"admin@mall.com", description:"Books, stationery, e-readers & educational materials for all ages.", phone:"9876543216", open:"10:00", close:"20:00", active:false, rating:4.1, reviewCount:38,  image:"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80", tags:["Books","Stationery","Education"] }
  ];

  const products = [
    // Electronics
    { id:"pr_1",  name:"MacBook Pro 14\"",     shopId:"sh_1", shopName:"TechZone",  category:"Electronics",      price:149900, discountPrice:134990, stock:8,   description:"Apple M3 chip, 16GB RAM, 512GB SSD. 17-hour battery life.", image:"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&q=80", featured:true,  rating:4.8, reviewCount:45,  tags:["laptop","apple","macbook"] },
    { id:"pr_2",  name:"iPhone 15 Pro",         shopId:"sh_1", shopName:"TechZone",  category:"Electronics",      price:134900, discountPrice:124900, stock:15,  description:"A17 Pro chip, 48MP camera, titanium design.", image:"https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=300&q=80", featured:true,  rating:4.7, reviewCount:89,  tags:["iphone","apple","smartphone"] },
    { id:"pr_3",  name:"Sony WH-1000XM5",       shopId:"sh_1", shopName:"TechZone",  category:"Electronics",      price:29990,  discountPrice:24990,  stock:22,  description:"Industry-leading noise cancellation, 30-hour battery.", image:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80", featured:true,  rating:4.6, reviewCount:67,  tags:["headphones","sony","anc"] },
    { id:"pr_4",  name:"Samsung 4K Smart TV 55\"",shopId:"sh_1", shopName:"TechZone", category:"Electronics",     price:59990,  discountPrice:49990,  stock:5,   description:"Crystal UHD display, Tizen OS, built-in Alexa.", image:"https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=300&q=80", featured:false, rating:4.4, reviewCount:31,  tags:["tv","samsung","4k"] },
    // Fashion
    { id:"pr_5",  name:"Levi's 511 Slim Jeans",  shopId:"sh_2", shopName:"StyleHub",  category:"Fashion",          price:3999,   discountPrice:2999,   stock:40,  description:"Classic slim fit, available in blue, black & grey. Sizes 28–38.", image:"https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&q=80", featured:true,  rating:4.3, reviewCount:112, tags:["jeans","levis","denim"] },
    { id:"pr_6",  name:"Floral Summer Dress",     shopId:"sh_2", shopName:"StyleHub",  category:"Fashion",          price:2499,   discountPrice:1799,   stock:28,  description:"Breathable cotton blend, A-line cut. Sizes XS–XXL.", image:"https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&q=80", featured:true,  rating:4.2, reviewCount:78,  tags:["dress","fashion","summer"] },
    { id:"pr_7",  name:"Leather Crossbody Bag",   shopId:"sh_2", shopName:"StyleHub",  category:"Fashion",          price:4500,   discountPrice:3299,   stock:18,  description:"Genuine leather, multiple compartments, adjustable strap.", image:"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&q=80", featured:false, rating:4.5, reviewCount:56,  tags:["bag","leather","accessories"] },
    // Food
    { id:"pr_8",  name:"Pepperoni Pizza (12\")",  shopId:"sh_3", shopName:"Food Court",category:"Food & Beverages", price:549,    discountPrice:449,    stock:999, description:"Hand-tossed crust, premium pepperoni, mozzarella & tomato sauce.", image:"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80", featured:true,  rating:4.8, reviewCount:234, tags:["pizza","fast food","italian"] },
    { id:"pr_9",  name:"Sushi Platter (20 pcs)",  shopId:"sh_3", shopName:"Food Court",category:"Food & Beverages", price:799,    discountPrice:649,    stock:999, description:"Chef's selection — salmon, tuna, cucumber & avocado rolls.", image:"https://images.unsplash.com/photo-1553621042-f6e147245754?w=300&q=80", featured:true,  rating:4.6, reviewCount:167, tags:["sushi","japanese","healthy"] },
    // Gaming
    { id:"pr_10", name:"PS5 DualSense Controller",shopId:"sh_4", shopName:"GameWorld", category:"Toys & Games",     price:5990,   discountPrice:4999,   stock:12,  description:"Haptic feedback, adaptive triggers, USB-C charging.", image:"https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=300&q=80", featured:true,  rating:4.7, reviewCount:88,  tags:["ps5","controller","gaming"] },
    { id:"pr_11", name:"Nintendo Switch OLED",     shopId:"sh_4", shopName:"GameWorld", category:"Toys & Games",     price:34990,  discountPrice:31999,  stock:7,   description:"7-inch OLED screen, enhanced audio, 64GB storage.", image:"https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=300&q=80", featured:true,  rating:4.9, reviewCount:143, tags:["nintendo","switch","portable"] },
    // Sports
    { id:"pr_12", name:"Nike Air Zoom Pegasus 40", shopId:"sh_5", shopName:"FitLife",   category:"Sports & Fitness", price:12995,  discountPrice:9999,   stock:20,  description:"Responsive foam cushioning, breathable upper, ideal for daily runs.", image:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80", featured:true,  rating:4.6, reviewCount:95,  tags:["nike","running","shoes"] },
    // Beauty
    { id:"pr_13", name:"Vitamin C Serum 30ml",     shopId:"sh_6", shopName:"GlowUp",    category:"Beauty & Health",  price:1299,   discountPrice:999,    stock:55,  description:"20% Vitamin C + E + Ferulic Acid. Brightening & anti-aging.", image:"https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&q=80", featured:true,  rating:4.5, reviewCount:211, tags:["skincare","vitaminc","serum"] },
    { id:"pr_14", name:"Dyson Airwrap Styler",      shopId:"sh_6", shopName:"GlowUp",    category:"Beauty & Health",  price:45900,  discountPrice:41900,  stock:4,   description:"Multi-styler with 6 attachments. Curls, waves & blowouts.", image:"https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&q=80", featured:true,  rating:4.8, reviewCount:72,  tags:["dyson","hair","styler"] }
  ];

  const offers = [
    { id:"of_1", title:"Tech Bonanza",      shopId:"sh_1", shopName:"TechZone",  discount:"10%",  code:"TECH10",   validFrom:"2025-01-01", validTo:"2025-12-31", description:"10% off all electronics. Valid on purchases above ₹5000.", active:true,  bgColor:"#1e3a5f" },
    { id:"of_2", title:"Fashion Fest",      shopId:"sh_2", shopName:"StyleHub",  discount:"20%",  code:"STYLE20",  validFrom:"2025-01-01", validTo:"2025-06-30", description:"Flat 20% off entire fashion collection.", active:true,  bgColor:"#4a1942" },
    { id:"of_3", title:"Mega Meal Deal",    shopId:"sh_3", shopName:"Food Court",discount:"15%",  code:"FOOD15",   validFrom:"2025-01-01", validTo:"2025-12-31", description:"15% off on all food items. Dine-in & takeaway.", active:true,  bgColor:"#1a3a1a" },
    { id:"of_4", title:"Gamer's Paradise",  shopId:"sh_4", shopName:"GameWorld", discount:"12%",  code:"GAME12",   validFrom:"2025-03-01", validTo:"2025-09-30", description:"Games & accessories sale. Limited period.", active:true,  bgColor:"#1a1a3a" },
    { id:"of_5", title:"Fitness First",     shopId:"sh_5", shopName:"FitLife",   discount:"18%",  code:"FIT18",    validFrom:"2025-01-01", validTo:"2025-06-30", description:"Get fit for less! 18% off all sports gear.", active:true,  bgColor:"#1a3a2a" },
    { id:"of_6", title:"Glow Sale",         shopId:"sh_6", shopName:"GlowUp",    discount:"25%",  code:"GLOW25",   validFrom:"2025-02-01", validTo:"2025-05-31", description:"Beauty bonanza — 25% off skincare & makeup.", active:false, bgColor:"#3a1a1a" }
  ];

  localStorage.setItem("sm_categories", JSON.stringify(categories));
  localStorage.setItem("sm_shops",      JSON.stringify(shops));
  localStorage.setItem("sm_products",   JSON.stringify(products));
  localStorage.setItem("sm_offers",     JSON.stringify(offers));
  localStorage.setItem("sm_cart",       JSON.stringify([]));
  localStorage.setItem("sm_wishlist",   JSON.stringify([]));
  localStorage.setItem("sm_reviews",    JSON.stringify([]));
  localStorage.setItem("sm_seeded_v2",  "1");
  Logger.info("firebase", "✅ Demo data v2 seeded");
})();
