
import { ExpenseCategory, PaymentMethod } from "../types/ledger";

interface CategoryDetail {
    label: string;
    icon: string; // Lucide icon name or description
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, CategoryDetail> = {
    "飲食": { label: "有機質配給 (Organic Rations)", icon: "Utensils" },
    "生活用品": { label: "後勤維護 (Logistics Maint.)", icon: "Package" },
    "教育": { label: "教條灌輸 (Indoctrination)", icon: "Book" },
    "醫療": { label: "生物修復 (Biological Repair)", icon: "Cross" },
    "保險": { label: "帝皇庇佑 (Emperor's Mercy)", icon: "Shield" },
    "交通": { label: "部隊移防 (Troop Deployment)", icon: "Truck" },
    "娛樂": { label: "士氣維護 (Morale Boost)", icon: "Smile" },
    "水電費": { label: "反應爐燃料 (Reactor Fuel)", icon: "Zap" },
    "一般稅務": { label: "帝國十一稅 (Imperial Tithe)", icon: "Scroll" },
    "公關費": { label: "外交獻金 (Diplomacy)", icon: "Handshake" },
    "通訊費": { label: "星語陣列 (Astropathic Link)", icon: "Radio" }, // Wifi -> Radio/Signal
    "治裝費": { label: "動力甲維護 (Wargear Maint.)", icon: "Shirt" },
    "房貸": { label: "巢都駐紮稅 (Hive Habitation Tithe)", icon: "Home" }
};

export const PAYMENT_METHODS: Record<PaymentMethod, string> = {
    "Cash": "硬通貨 (Hard Currency)",
    "CreditCard": "信用數據板 (Credit Slate)",
    "Digital": "機魂轉帳 (Machine Spirit Transfer)"
};
