/**
 * data-services.js — All CRUD services for SuperMall v2
 * ShopService | ProductService | OfferService | CategoryService
 * CartService | WishlistService | ReviewService
 */

// ── Firestore helper factory ───────────────────────────────────
function makeService(C) {
  const fb = () => db.collection(C);
  const ts = () => firebase.firestore.FieldValue.serverTimestamp();

  async function getAll() {
    Logger.info(C,"getAll");
    if (DEMO_MODE) return MockDB.getAll(C);
    return (await fb().orderBy("createdAt","desc").get()).docs.map(d=>({id:d.id,...d.data()}));
  }
  async function getById(id) {
    if (DEMO_MODE) return MockDB.getById(C,id);
    const d = await fb().doc(id).get();
    return d.exists ? {id:d.id,...d.data()} : null;
  }
  async function where(field, op, val) {
    if (DEMO_MODE) return MockDB.query(C,field,op,val);
    return (await fb().where(field,op,val).get()).docs.map(d=>({id:d.id,...d.data()}));
  }
  async function create(data) {
    Logger.info(C,"create",{data});
    if (DEMO_MODE) return MockDB.add(C,data);
    const r = await fb().add({...data, createdAt:ts()});
    return {id:r.id,...data};
  }
  async function update(id, data) {
    Logger.info(C,"update",{id});
    if (DEMO_MODE) return MockDB.update(C,id,data);
    await fb().doc(id).update({...data, updatedAt:ts()});
    return {id,...data};
  }
  async function remove(id) {
    Logger.info(C,"remove",{id});
    if (DEMO_MODE) return MockDB.delete(C,id);
    return fb().doc(id).delete();
  }
  return { getAll, getById, where, create, update, remove };
}

// ════════════════════════════════════════════════════════════
//  SHOP SERVICE
// ════════════════════════════════════════════════════════════
const ShopService = (() => {
  const base = makeService("sm_shops");
  async function search(q) {
    const all = await base.getAll();
    const lq = q.toLowerCase();
    return all.filter(s => s.name.toLowerCase().includes(lq) || (s.category||"").toLowerCase().includes(lq) || (s.floor||"").toLowerCase().includes(lq));
  }
  async function getByCategory(cat) { return (await base.getAll()).filter(s => s.category === cat); }
  async function getByFloor(floor)   { return (await base.getAll()).filter(s => s.floor === floor); }
  return { ...base, search, getByCategory, getByFloor };
})();

// ════════════════════════════════════════════════════════════
//  PRODUCT SERVICE
// ════════════════════════════════════════════════════════════
const ProductService = (() => {
  const base = makeService("sm_products");
  async function getByShop(sid)     { return (await base.getAll()).filter(p => p.shopId === sid); }
  async function getByCategory(cat) { return (await base.getAll()).filter(p => p.category === cat); }
  async function getFeatured()      { return (await base.getAll()).filter(p => p.featured); }
  async function search(q) {
    const all = await base.getAll();
    const lq = q.toLowerCase();
    return all.filter(p => p.name.toLowerCase().includes(lq) || (p.category||"").toLowerCase().includes(lq) || (p.shopName||"").toLowerCase().includes(lq) || (p.tags||[]).some(t=>t.includes(lq)));
  }
  async function compare(id1, id2)  { return Promise.all([base.getById(id1), base.getById(id2)]); }
  return { ...base, getByShop, getByCategory, getFeatured, search, compare };
})();

// ════════════════════════════════════════════════════════════
//  OFFER SERVICE
// ════════════════════════════════════════════════════════════
const OfferService = (() => {
  const base = makeService("sm_offers");
  async function getActive()        { return (await base.getAll()).filter(o => o.active); }
  async function getByShop(sid)     { return (await base.getAll()).filter(o => o.shopId === sid); }
  async function toggleActive(id, current) {
    Logger.info("offer","toggle",{id,to:!current});
    return base.update(id, { active: !current });
  }
  return { ...base, getActive, getByShop, toggleActive };
})();

// ════════════════════════════════════════════════════════════
//  CATEGORY SERVICE
// ════════════════════════════════════════════════════════════
const CategoryService = (() => {
  const base = makeService("sm_categories");
  async function getUniqueFloors() {
    return [...new Set((await base.getAll()).map(c => c.floor))].sort();
  }
  async function getByFloor(floor) {
    return (await base.getAll()).filter(c => c.floor === floor);
  }
  return { ...base, getUniqueFloors, getByFloor };
})();

// ════════════════════════════════════════════════════════════
//  CART SERVICE (localStorage — per session)
// ════════════════════════════════════════════════════════════
const CartService = (() => {
  const KEY = "sm_cart";
  const read  = ()     => JSON.parse(localStorage.getItem(KEY) || "[]");
  const write = (data) => localStorage.setItem(KEY, JSON.stringify(data));

  function getAll()   { return read(); }
  function getCount() { return read().reduce((s,i) => s+i.qty, 0); }
  function getTotal() { return read().reduce((s,i) => s+(i.price*i.qty), 0); }

  function add(product, qty = 1) {
    const cart = read();
    const idx  = cart.findIndex(i => i.id === product.id);
    if (idx >= 0) {
      cart[idx].qty += qty;
    } else {
      cart.push({ id:product.id, name:product.name, price:product.discountPrice||product.price, image:product.image, shopName:product.shopName, qty });
    }
    write(cart);
    Logger.info("cart","add",{product:product.name,qty});
    UI.updateCartBadge();
    return cart;
  }

  function updateQty(id, qty) {
    const cart = read().map(i => i.id === id ? {...i, qty} : i).filter(i => i.qty > 0);
    write(cart); UI.updateCartBadge(); return cart;
  }

  function remove(id) {
    write(read().filter(i => i.id !== id));
    UI.updateCartBadge();
    Logger.info("cart","remove",{id});
  }

  function clear() { write([]); UI.updateCartBadge(); }

  return { getAll, getCount, getTotal, add, updateQty, remove, clear };
})();

// ════════════════════════════════════════════════════════════
//  WISHLIST SERVICE (localStorage)
// ════════════════════════════════════════════════════════════
const WishlistService = (() => {
  const KEY = "sm_wishlist";
  const read  = ()     => JSON.parse(localStorage.getItem(KEY) || "[]");
  const write = (data) => localStorage.setItem(KEY, JSON.stringify(data));

  function getAll()       { return read(); }
  function isWishlisted(id) { return read().some(i => i.id === id); }

  function toggle(product) {
    const list = read();
    const idx  = list.findIndex(i => i.id === product.id);
    if (idx >= 0) { list.splice(idx, 1); Logger.info("wishlist","remove",{id:product.id}); }
    else          { list.push({ id:product.id, name:product.name, price:product.discountPrice||product.price, image:product.image, shopName:product.shopName }); Logger.info("wishlist","add",{id:product.id}); }
    write(list);
    return idx < 0; // returns true if added
  }

  function remove(id) { write(read().filter(i => i.id !== id)); }

  return { getAll, isWishlisted, toggle, remove };
})();

// ════════════════════════════════════════════════════════════
//  REVIEW SERVICE
// ════════════════════════════════════════════════════════════
const ReviewService = (() => {
  const base = makeService("sm_reviews");

  async function getByProduct(productId) {
    return (await base.getAll()).filter(r => r.productId === productId);
  }
  async function getByShop(shopId) {
    return (await base.getAll()).filter(r => r.shopId === shopId);
  }
  async function addReview(data) {
    const review = {
      ...data,
      userName: Auth.currentUser()?.name || "Anonymous",
      userId:   Auth.currentUser()?.uid  || "anon",
      date:     new Date().toLocaleDateString("en-IN")
    };
    return base.create(review);
  }
  return { ...base, getByProduct, getByShop, addReview };
})();
