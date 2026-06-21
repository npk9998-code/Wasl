// ============================================
// أدوات مشتركة لكل صفحات التطبيق
// ============================================

/* ---------- تحويل الأرقام العربية إلى إنجليزية ---------- */
function convertArabicDigits(str) {
  if (str === null || str === undefined) return str;
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return String(str).replace(/[٠-٩]/g, d => arabic.indexOf(d));
}

/* ---------- إزالة الفواصل وإرجاع رقم نقي ---------- */
function toRawNumber(str) {
  if (str === null || str === undefined || str === "") return "";
  const converted = convertArabicDigits(str).replace(/[^\d.]/g, "");
  return converted;
}

/* ---------- تنسيق فواصل الآلاف أثناء الكتابة ---------- */
function formatLiveNumber(inputEl) {
  inputEl.addEventListener("input", () => {
    const cursorFromEnd = inputEl.value.length - inputEl.selectionStart;
    const raw = toRawNumber(inputEl.value);
    if (raw === "") { inputEl.value = ""; return; }
    const num = Number(raw);
    if (isNaN(num)) return;
    inputEl.value = num.toLocaleString("en-US");
    const newPos = Math.max(inputEl.value.length - cursorFromEnd, 0);
    inputEl.setSelectionRange(newPos, newPos);
  });
}

/* تطبيق التنسيق + تحويل الأرقام على كل حقل رقمي داخل عنصر أب */
function attachNumericBehavior(root = document) {
  root.querySelectorAll("[data-numeric]").forEach(el => formatLiveNumber(el));
  root.querySelectorAll("[data-phone]").forEach(el => {
    el.addEventListener("input", () => {
      const pos = el.selectionStart;
      el.value = convertArabicDigits(el.value).replace(/[^\d+]/g, "");
      el.setSelectionRange(pos, pos);
    });
  });
}

function getRawValue(inputEl) {
  return toRawNumber(inputEl.value);
}

/* ---------- مزامنة سحابية عبر JSONBin ---------- */
const CloudStore = {
  async load() {
    try {
      const res = await fetch(`${JSONBIN_CONFIG.BASE_URL}/${JSONBIN_CONFIG.BIN_ID}/latest`, {
        headers: { "X-Master-Key": JSONBIN_CONFIG.API_KEY }
      });
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json();
      const record = json.record || {};
      return { sellers: record.sellers || [], buyers: record.buyers || [] };
    } catch (e) {
      console.error("CloudStore.load error:", e);
      const cached = localStorage.getItem("re_cache");
      return cached ? JSON.parse(cached) : { sellers: [], buyers: [] };
    }
  },

  async save(data) {
    localStorage.setItem("re_cache", JSON.stringify(data));
    try {
      const res = await fetch(`${JSONBIN_CONFIG.BASE_URL}/${JSONBIN_CONFIG.BIN_ID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": JSONBIN_CONFIG.API_KEY
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("save failed");
      return true;
    } catch (e) {
      console.error("CloudStore.save error:", e);
      return false;
    }
  }
};

/* ---------- مفضلة محلية ---------- */
const Favorites = {
  KEY: "re_favorites",
  getAll() {
    return JSON.parse(localStorage.getItem(this.KEY) || "[]");
  },
  isFav(id) {
    return this.getAll().includes(id);
  },
  toggle(id) {
    let list = this.getAll();
    if (list.includes(id)) list = list.filter(x => x !== id);
    else list.push(id);
    localStorage.setItem(this.KEY, JSON.stringify(list));
    return list.includes(id);
  }
};

/* ---------- تنسيق رقم للعرض ---------- */
function formatNumberDisplay(num) {
  if (num === null || num === undefined || num === "") return "—";
  return Number(num).toLocaleString("en-US");
}

/* ---------- توليد معرف فريد ---------- */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ---------- بناء رسالة واتساب للمشاركة ---------- */
function buildShareMessage(item, type) {
  const link = window.location.origin + window.location.pathname.replace(/[^/]+$/, "") + "client.html";
  if (type === "seller") {
    return `🏠 *عرض عقاري*\n` +
      `📍 ${item.city} - ${item.neighborhood || ""}\n` +
      `🏗️ النوع: ${item.propertyType}\n` +
      `📐 المساحة: ${formatNumberDisplay(item.area)} م²\n` +
      `💰 السعر: ${formatNumberDisplay(item.price)} ريال${item.negotiable ? " (قابل للتفاوض)" : ""}\n` +
      `🔗 ${link}`;
  } else {
    return `🔍 *طلب عقاري*\n` +
      `📍 ${item.city} - ${(item.neighborhoods || []).join("، ") || ""}\n` +
      `🏗️ النوع: ${item.propertyType}\n` +
      `📐 المساحة المطلوبة: ${formatNumberDisplay(item.areaFrom)} - ${formatNumberDisplay(item.areaTo)} م²\n` +
      `💰 الميزانية: ${formatNumberDisplay(item.budgetFrom)} - ${formatNumberDisplay(item.budgetTo)} ريال\n` +
      `🔗 ${link}`;
  }
}

function whatsappChatUrl(phone, text) {
  const clean = (phone || "").replace(/[^\d]/g, "").replace(/^0/, "966");
  return `https://wa.me/${clean}${text ? "?text=" + encodeURIComponent(text) : ""}`;
}

function telUrl(phone) {
  return `tel:${(phone || "").replace(/[^\d+]/g, "")}`;
}
