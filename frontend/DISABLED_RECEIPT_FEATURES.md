# 🖨️ PlayBase Frontend — Vaqtincha O'chirilgan (Commentlangan) Chek va Printer Qismlari

> **Holat:** Chek apparat ulash va chek chiqarish qismlari foydalanuvchi talabiga asosan vaqtincha to'liq commentga olinib, interfeysdan yashirildi.  
> **Sana:** 2026-10-08

---

## 📂 Commentlangan Fayllar va Qismlar Ro'yxati

### 1. `frontend/src/views/SettingsView.tsx`
* **Printer holati (state) va funksiyalari:**
  - `printers`, `isLoadingPrinters`, `isTestingPrint` statelari.
  - `fetchPrinters()` va `handleTestPrint(deviceId)` API so'rovlari.
  - Teg: `/* DISABLED_RECEIPT_PRINTER: ... */`
* **Subtab navigatsiya tugmasi:**
  - Sozlamalardagi *"Chek Apparat (POS Printer)"* bo'limi tugmasi yashirildi.
  - Teg: `{/* DISABLED_RECEIPT_PRINTER: ... */}`
* **Printer Sozlamalari bo'limi (TAB 3):**
  - Chek printerlar ro'yxati, Online/Offline holati, Token nusxalash va *"Test Chek Chiqarish"* kartochkalari hamda o'rnatish qo'llanmasi to'liq commentga olindi.
  - Teg: `{/* DISABLED_RECEIPT_PRINTER: TAB 3 ... */}`
* **Chek Ko'rinishi (Live Receipt Preview):**
  - Klub profili (TAB 4) dagi *"Chek Ko'rinishi (Preview)"* namunaviy kvitansiya kartasi commentga olindi.
  - Teg: `{/* DISABLED_RECEIPT_PREVIEW: ... */}`
* **Matnlar tozalanishi:**
  - *"Klub Telefon Raqami (Chekda chiqadi)"* va *"Klub Manzili (Chekda va Botda ko'rinadi)"* yozuvlari neytral profil rekvizitlariga o'zgartirildi.

---

### 2. `frontend/src/components/modals/CheckoutReceiptModal.tsx`
* **Chek chop etish funksiyasi:**
  - `handlePrint` (`window.print()`) funksiyasi commentga olindi.
  - Teg: `/* DISABLED_RECEIPT_PRINT: ... */`
* **Chop etish tugmasi:**
  - Seansni yopish modalidagi *"Kvitansiyani Chop Etish"* tugmasi yashirildi.
  - Teg: `{/* DISABLED_RECEIPT_PRINT_BUTTON: ... */}`

---

## 🔄 Qayta yoqish (Re-enable) bo'yicha ko'rsatma:
Kelajakda chek apparati yoki printer xususiyatini qayta faollashtirish uchun:
1. `SettingsView.tsx` va `CheckoutReceiptModal.tsx` fayllaridan `DISABLED_RECEIPT_...` bilan belgilangan comment bloklarini ochib qo'yish kifoya.
2. Backend va `print_agent` modullari to'liq saqlanib qolgan va ishlashga tayyor.
