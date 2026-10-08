import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';
import { formatMoney, parseMoney } from '../utils/formatters';

export const SettingsView: React.FC = () => {
  const { currentClub, liveTables, fetchLiveTables, initApp, setCurrentView } = useAppStore();

  const [activeSubTab, setActiveSubTab] = useState<'ZONES' | 'TABLES' | 'PRINTER' | 'CLUB'>('ZONES');

  // Club Profile Edit State
  const [clubName, setClubName] = useState<string>(currentClub?.name || '');
  const [clubPhone, setClubPhone] = useState<string>(currentClub?.phone || '');
  const [clubAddress, setClubAddress] = useState<string>(currentClub?.address || '');
  const [clubCurrency, setClubCurrency] = useState<string>(currentClub?.currency || 'UZS');
  const [clubRounding, setClubRounding] = useState<number>(currentClub?.rounding_unit || 500);
  const [clubLogoUrl, setClubLogoUrl] = useState<string>(currentClub?.logo_url || '');
  const [isSavingClub, setIsSavingClub] = useState(false);

  React.useEffect(() => {
    if (currentClub) {
      setClubName(currentClub.name || '');
      setClubPhone(currentClub.phone || '');
      setClubAddress(currentClub.address || '');
      setClubCurrency(currentClub.currency || 'UZS');
      setClubRounding(currentClub.rounding_unit || 500);
      setClubLogoUrl(currentClub.logo_url || '');
    }
  }, [currentClub]);

  const handleSaveClubProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClub?.id) return;
    if (!clubName.trim()) {
      toast.error("Klub nomi bo'sh bo'lishi mumkin emas.");
      return;
    }

    setIsSavingClub(true);
    try {
      await apiClient.patch(`/clubs/${currentClub.id}/`, {
        name: clubName.trim(),
        phone: clubPhone.trim() || null,
        address: clubAddress.trim() || null,
        currency: clubCurrency.trim(),
        rounding_unit: Number(clubRounding),
        logo_url: clubLogoUrl.trim() || null,
      });
      toast.success("Klub ma'lumotlari muvaffaqiyatli saqlandi!");
      await initApp();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Klub ma'lumotlarini saqlashda xatolik.");
    } finally {
      setIsSavingClub(false);
    }
  };

  /* DISABLED_RECEIPT_PRINTER: Printer state va funksiyalari vaqtincha o'chirildi
  // Printer State
  const [printers, setPrinters] = useState<any[]>([]);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [isTestingPrint, setIsTestingPrint] = useState(false);

  const fetchPrinters = React.useCallback(async () => {
    if (!currentClub?.id) return;
    setIsLoadingPrinters(true);
    try {
      const res = await apiClient.get(`/printers/devices/?club_id=${currentClub.id}`);
      setPrinters(res.data.results || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingPrinters(false);
    }
  }, [currentClub?.id]);

  React.useEffect(() => {
    if (activeSubTab === 'PRINTER') {
      fetchPrinters();
    }
  }, [activeSubTab, fetchPrinters]);

  const handleTestPrint = async (deviceId: string) => {
    setIsTestingPrint(true);
    try {
      await apiClient.post(`/printers/devices/${deviceId}/test-print/`);
      toast.success("Test chek navbatga yuborildi! Chek apparatidan chiqmoqda...");
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Test chek yuborishda xatolik.");
    } finally {
      setIsTestingPrint(false);
    }
  };
  */

  // New Zone State
  const [zoneName, setZoneName] = useState<string>('');
  const [zoneRate, setZoneRate] = useState<string>('30000');
  const [zoneColor, setZoneColor] = useState<string>('#10b981');

  // Bulk Table State
  const [bulkZoneId, setBulkZoneId] = useState<string>('');
  const [bulkPrefix, setBulkPrefix] = useState<string>('Stol');
  const [bulkCount, setBulkCount] = useState<string | number>(3);

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) {
      toast.error("Zona nomini kiriting.");
      return;
    }

    const rateNum = parseFloat(zoneRate);
    if (isNaN(rateNum) || rateNum <= 0) {
      toast.error("Soatlik narx kamida 1 so'm bo'lishi shart! (0 yoki bo'sh qo'yib bo'lmaydi)");
      return;
    }

    try {
      await apiClient.post('/zones/', {
        club: currentClub?.id,
        name: zoneName,
        hourly_rate: rateNum,
        color_code: zoneColor,
        icon: 'sports_esports',
        order: (currentClub?.zones?.length || 0) + 1
      });
      toast.success("Yangi zona muvaffaqiyatli yaratildi!");
      setZoneName('');
      await initApp();
    } catch (err: any) {
      toast.error("Zonani yaratishda xatolik.");
    }
  };

  const handleBulkCreateTables = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkZoneId) {
      toast.error("Zonani tanlang.");
      return;
    }

    const countNum = parseInt(String(bulkCount), 10);
    if (isNaN(countNum) || countNum < 1) {
      toast.error("Stollar soni kamida 1 ta bo'lishi shart! (0 yoki bo'sh qo'yib bo'lmaydi)");
      return;
    }

    const maxAllowedTables = currentClub?.active_plan_detail?.max_tables || 10;
    const currentCount = liveTables.length;
    const availableSlots = Math.max(0, maxAllowedTables - currentCount);

    if (availableSlots <= 0) {
      toast.error(
        `Tarifingizdagi maksimal stollar limitiga (${maxAllowedTables} ta) yetilgan. Yangi stol qo'shish uchun tarifni oshiring.`
      );
      return;
    }

    if (countNum > availableSlots) {
      toast.error(
        `Tarifingizda maksimal ${maxAllowedTables} ta stol ruxsat etilgan. Hozirda ${currentCount} ta mavjud. Siz ko'pi bilan ${availableSlots} ta stol qo'sha olasiz.`
      );
      return;
    }

    try {
      const nextNum = (liveTables.length || 0) + 1;
      await apiClient.post('/tables/bulk-create/', {
        club_id: currentClub?.id,
        zone_id: bulkZoneId,
        prefix: bulkPrefix,
        start_number: nextNum,
        count: countNum
      });
      toast.success(`${countNum} ta stol yaratildi!`);
      await fetchLiveTables();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Stollarni yaratishda xatolik.");
    }
  };

  const handleToggleMaintenance = async (tableId: string) => {
    try {
      await apiClient.post(`/tables/${tableId}/toggle-maintenance/`);
      toast.success("Stol holati o'zgartirildi.");
      await fetchLiveTables();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Xatolik yuz berdi.");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn pb-24 md:pb-8">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">
          Klub Sozlamalari, Zonalar va Stollar
        </h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          O'yin zonalari tariflari, stollarni sozlash va klub parametrlari
        </p>
      </div>

      {/* Sub tabs */}
      <div className="flex border-b border-surface-container-highest gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('ZONES')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'ZONES'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-base">dashboard_customize</span>
          <span>O'yin Zonalari ({currentClub?.zones?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('TABLES')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'TABLES'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-base">table_restaurant</span>
          <span>Stollar ({liveTables.length})</span>
        </button>

        {/* DISABLED_RECEIPT_PRINTER: Chek apparat tab tugmasi vaqtincha o'chirildi
        <button
          onClick={() => setActiveSubTab('PRINTER')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'PRINTER'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-base">print</span>
          <span>Chek Apparat (POS Printer)</span>
        </button>
        */}

        <button
          onClick={() => setActiveSubTab('CLUB')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'CLUB'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-base">storefront</span>
          <span>Klub Profili & Rekvizitlar</span>
        </button>
      </div>

      {/* TAB 1: ZONES */}
      {activeSubTab === 'ZONES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Existing Zones */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-white">Mavjud Zonalar</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentClub?.zones?.map((zone) => (
                <div
                  key={zone.id}
                  className="p-4 rounded-2xl bg-surface-container border border-surface-container-highest space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: zone.color_code }}></span>
                      <h4 className="font-bold text-white text-sm">{zone.name}</h4>
                    </div>
                    <span className="text-[11px] font-mono text-primary font-bold px-2 py-0.5 rounded bg-primary/10">
                      Faol
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-2 border-t border-surface-container-highest/60">
                    <span className="text-xs text-on-surface-variant">Soatlik tarif:</span>
                    <span className="font-mono font-extrabold text-white text-base">
                      {zone.hourly_rate.toLocaleString()} so'm
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Zone Form */}
          <div className="p-5 rounded-2xl bg-surface-container border border-surface-container-highest space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">add_circle</span>
              <span>Yangi Zona Qo'shish</span>
            </h3>

            <form onSubmit={handleCreateZone} className="space-y-3 text-xs">
              <div>
                <label className="text-on-surface-variant block mb-1">Zona Nomi</label>
                <input
                  type="text"
                  placeholder="Masalan: PlayStation 5 VIP"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-on-surface-variant block mb-1">Soatlik Narx (so'm)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="30 000"
                  value={zoneRate ? formatMoney(zoneRate) : (zoneRate === '0' ? '0' : '')}
                  onChange={(e) => {
                    const parsed = parseMoney(e.target.value);
                    setZoneRate(parsed > 0 ? parsed.toString() : (e.target.value.trim() === '0' ? '0' : ''));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-white font-mono focus:outline-none focus:border-primary"
                />
                {zoneRate === '0' && (
                  <p className="text-[10px] text-amber-400 mt-1 font-medium">
                    ⚠️ Soatlik narx 0 bo'lishi mumkin emas (kamida 1 so'm)
                  </p>
                )}
              </div>

              <div>
                <label className="text-on-surface-variant block mb-1">Rang kodi</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={zoneColor}
                    onChange={(e) => setZoneColor(e.target.value)}
                    className="w-10 h-9 rounded bg-transparent cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={zoneColor}
                    onChange={(e) => setZoneColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-xl bg-primary hover:bg-primary-fixed text-surface font-bold text-xs"
              >
                Zonani Saqlash
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: TABLES */}
      {activeSubTab === 'TABLES' && (() => {
        const maxAllowedTables = currentClub?.active_plan_detail?.max_tables || 10;
        const currentCount = liveTables.length;
        const availableSlots = Math.max(0, maxAllowedTables - currentCount);
        const isLimitReached = availableSlots <= 0;
        const isExceeding = Number(bulkCount) > availableSlots && !isLimitReached;

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Existing Tables List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Barcha Stollar va Resurslar</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-surface-container-highest text-on-surface-variant font-mono">
                    {currentCount} ta
                  </span>
                </h3>

                {/* Plan capacity indicator */}
                <div className="text-xs flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-xl border border-surface-container-highest">
                  <span className="text-on-surface-variant">Tarif sig'imi:</span>
                  <span className={`font-bold font-mono ${isLimitReached ? 'text-amber-400' : 'text-primary'}`}>
                    {currentCount} / {maxAllowedTables} ta
                  </span>
                  {availableSlots > 0 ? (
                    <span className="text-[11px] text-emerald-400 font-medium">({availableSlots} ta bo'sh)</span>
                  ) : (
                    <span className="text-[11px] text-amber-400 font-bold">(To'lgan)</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {liveTables.map((t) => (
                  <div
                    key={t.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
                      t.is_plan_locked
                        ? 'bg-surface-container-lowest/80 border-amber-500/40 shadow-sm'
                        : 'bg-surface-container border-surface-container-highest'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{t.name}</span>
                        <span className="text-xs text-on-surface-variant font-mono">#{t.number}</span>
                        {t.is_plan_locked && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[11px]">lock</span>
                            <span>Tarif limiti</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.zone_color }}></span>
                        <span>{t.zone_name}</span>
                        {t.is_plan_locked && (
                          <span className="text-amber-400/80 font-medium">• Foydalanish bloklangan</span>
                        )}
                      </div>
                    </div>

                    {!t.is_plan_locked ? (
                      <button
                        onClick={() => handleToggleMaintenance(t.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                          t.status === 'MAINTENANCE'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-surface-container-highest hover:bg-surface-bright text-on-surface-variant hover:text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">build</span>
                        <span>{t.status === 'MAINTENANCE' ? 'Servisda' : 'Servisga olish'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setCurrentView('billing')}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">upgrade</span>
                        <span>Ochish</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bulk Create Form */}
            <div className="p-5 rounded-3xl bg-surface-container border border-surface-container-highest space-y-4 h-fit">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">library_add</span>
                  <span>Ommaviy Stol Qo'shish</span>
                </h3>
                <span className="text-[11px] text-on-surface-variant font-mono">
                  Maks: {maxAllowedTables} ta
                </span>
              </div>

              {isLimitReached ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <span className="material-symbols-outlined text-base">warning</span>
                    <span>Tarif limitiga yetildi</span>
                  </div>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    Sizning joriy tarifingizda maksimal <b>{maxAllowedTables} ta</b> stol boshqarish mumkin. Yangi stol qo'shish uchun tarifni oshirishingiz zarur.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentView('billing')}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">bolt</span>
                    <span>Tarifni Yangilash</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBulkCreateTables} className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-on-surface-variant block mb-1 font-semibold">Zona Tanlang</label>
                    <select
                      value={bulkZoneId}
                      onChange={(e) => setBulkZoneId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-white focus:outline-none focus:border-primary"
                    >
                      <option value="">Zonani tanlang...</option>
                      {currentClub?.zones?.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} ({z.hourly_rate.toLocaleString()} so'm)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-on-surface-variant block mb-1 font-semibold">Nom prefiksi</label>
                    <input
                      type="text"
                      value={bulkPrefix}
                      onChange={(e) => setBulkPrefix(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-white focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-on-surface-variant font-semibold">Stollar soni</label>
                      <span className="text-[11px] text-emerald-400 font-mono">
                        (Bo'sh joy: {availableSlots} ta)
                      </span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max={availableSlots}
                      placeholder="1"
                      value={bulkCount}
                      onChange={(e) => setBulkCount(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-white font-mono focus:outline-none focus:border-primary"
                    />
                    {(bulkCount === '' || Number(bulkCount) < 1) && (
                      <p className="text-[10px] text-amber-400 mt-1 font-medium">
                        ⚠️ Stollar soni kamida 1 ta bo'lishi shart (0 qo'yib bo'lmaydi)
                      </p>
                    )}
                  </div>

                  {isExceeding && (
                    <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-[11px] text-rose-300 font-medium">
                      ⚠️ Siz {bulkCount} ta stol kiritdingiz, lekin tarif bo'yicha faqat {availableSlots} ta stol yaratishingiz mumkin.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isExceeding}
                    className={`w-full mt-2 py-3 rounded-xl font-bold text-xs transition-all ${
                      isExceeding
                        ? 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'
                        : 'bg-primary hover:bg-primary-fixed text-surface shadow-md active:scale-95'
                    }`}
                  >
                    Stollarni Yaratish (+{bulkCount})
                  </button>
                </form>
              )}
            </div>
          </div>
        );
      })()}

      {/* DISABLED_RECEIPT_PRINTER: TAB 3 (Chek printer sozlamalari) vaqtincha o'chirildi
      {activeSubTab === 'PRINTER' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-3xl bg-surface-container border border-surface-container-highest space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-container-highest">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">print</span>
                  <span>Kassa & Bar Chek Printeri (ESC/POS)</span>
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Kompyuterdagi termal chek apparatiga avtomatik chek chiqarish ulanmasi
                </p>
              </div>

              <button
                onClick={fetchPrinters}
                disabled={isLoadingPrinters}
                className="px-4 py-2 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-xs font-semibold text-white flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <span className={`material-symbols-outlined text-sm ${isLoadingPrinters ? 'animate-spin' : ''}`}>
                  refresh
                </span>
                <span>Yangilash</span>
              </button>
            </div>

            {printers.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant text-xs space-y-2">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">print_disabled</span>
                <p>Bu klub uchun printer topilmadi.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {printers.map((prn) => (
                  <div
                    key={prn.id}
                    className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-highest space-y-4 shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-xl">receipt_long</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{prn.name}</h4>
                          <div className="text-[11px] text-on-surface-variant font-mono">
                            Model: {prn.printer_model || 'Termal Printer (58mm / 80mm)'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            prn.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'
                          }`}
                        />
                        <span
                          className={`text-[11px] font-bold ${
                            prn.is_online ? 'text-emerald-400' : 'text-zinc-400'
                          }`}
                        >
                          {prn.is_online ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-container border border-surface-container-highest space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider flex items-center justify-between">
                        <span>Agent Ulanish Kaliti (Token):</span>
                        <span className="text-[10px] text-primary lowercase font-normal">maxfiy</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono font-bold text-emerald-400 select-all break-all">
                          {prn.token}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(prn.token);
                            toast.success("Printer tokeni nusxalandi!");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-xs text-white flex items-center gap-1 shrink-0"
                          title="Tokenni nusxalash"
                        >
                          <span className="material-symbols-outlined text-xs">content_copy</span>
                          <span>Nusxa</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-surface-container-highest flex items-center justify-between gap-2">
                      <div className="text-[11px] text-on-surface-variant">
                        Qog'oz: <strong className="text-white font-mono">{prn.paper_width} mm</strong>
                      </div>

                      <button
                        onClick={() => handleTestPrint(prn.id)}
                        disabled={isTestingPrint}
                        className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-fixed text-surface font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">print</span>
                        <span>Test Chek Chiqarish</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-surface-container-low border border-surface-container-highest space-y-4">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-lg">help</span>
              <span>Kassa Kompyuteriga O'rnatish Qo'llanmasi</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-on-surface-variant">
              <div className="p-4 rounded-2xl bg-surface-container border border-surface-container-highest space-y-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">1</div>
                <h5 className="font-bold text-white">Faylni ochish</h5>
                <p>Loyiha ichidagi <code>print_agent/config.json</code> faylini oching va yuqoridagi <strong>Token</strong>ni kiriting.</p>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container border border-surface-container-highest space-y-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">2</div>
                <h5 className="font-bold text-white">1 marta bosish</h5>
                <p><code>install_agent.bat</code> faylini sichqoncha bilan bosing. U dasturni avtomatik ravishda <strong>Avtozagruzkaga</strong> qo'shadi.</p>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container border border-surface-container-highest space-y-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">3</div>
                <h5 className="font-bold text-white">Avtomatik cheklar</h5>
                <p>Barda mahsulot sotilganda yoki stol yopilganda kassa apparatidan to'g'ridan-to'g'ri avtomatik chek chiqib keladi.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      */}

      {/* TAB 4: CLUB PROFILE & SETTINGS */}
      {activeSubTab === 'CLUB' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Edit Form */}
          <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-surface-container border border-surface-container-highest space-y-6">
            <div className="pb-4 border-b border-surface-container-highest">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">storefront</span>
                <span>Klub Profili va Asosiy Rekvizitlari</span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Klubingiz nomi, telefon raqami, manzili va asosiy rekvizitlari
              </p>
            </div>

            <form onSubmit={handleSaveClubProfile} className="space-y-4 text-xs">
              {/* Club Name */}
              <div>
                <label className="text-on-surface-variant font-bold block mb-1.5 uppercase tracking-wider text-[11px]">
                  Klub Nomi <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: PlayBase VIP Game Lounge"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-surface-container-lowest border border-surface-container-highest text-white font-medium focus:outline-none focus:border-primary text-sm shadow-inner"
                />
              </div>

              {/* Phone & Currency Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-on-surface-variant font-bold block mb-1.5 uppercase tracking-wider text-[11px]">
                    Klub Telefon Raqami
                  </label>
                  <input
                    type="text"
                    placeholder="+998 90 123 45 67"
                    value={clubPhone}
                    onChange={(e) => setClubPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-surface-container-lowest border border-surface-container-highest text-white font-mono focus:outline-none focus:border-primary text-sm shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-on-surface-variant font-bold block mb-1.5 uppercase tracking-wider text-[11px]">
                    Asosiy Valyuta
                  </label>
                  <select
                    value={clubCurrency}
                    onChange={(e) => setClubCurrency(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-surface-container-lowest border border-surface-container-highest text-white font-mono focus:outline-none focus:border-primary text-sm shadow-inner"
                  >
                    <option value="UZS">UZS (O'zbekiston So'mi)</option>
                    <option value="USD">USD ($ AQSh Dollari)</option>
                    <option value="EUR">EUR (€ Yevro)</option>
                    <option value="KZT">KZT (Qozog'iston Tengesi)</option>
                    <option value="RUB">RUB (Rossiya Rubli)</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-on-surface-variant font-bold block mb-1.5 uppercase tracking-wider text-[11px]">
                  Klub Manzili (Botda ko'rinadi)
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Toshkent sh., Chilonzor tumani, 9-kvartal, 15-bino"
                  value={clubAddress}
                  onChange={(e) => setClubAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-surface-container-lowest border border-surface-container-highest text-white focus:outline-none focus:border-primary text-sm shadow-inner"
                />
              </div>

              {/* Rounding Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-on-surface-variant font-bold block mb-1.5 uppercase tracking-wider text-[11px]">
                    Kassa Yaxlitlash Qoidasi (Sekundomer narxini)
                  </label>
                  <select
                    value={clubRounding}
                    onChange={(e) => setClubRounding(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl bg-surface-container-lowest border border-surface-container-highest text-white font-mono focus:outline-none focus:border-primary text-sm shadow-inner"
                  >
                    <option value={100}>100 so'mgacha yaxlitlash</option>
                    <option value={500}>500 so'mgacha yaxlitlash (Tavsiya)</option>
                    <option value={1000}>1 000 so'mgacha yaxlitlash</option>
                    <option value={1}>Yaxlitlanmasin (Aniq tiyingacha)</option>
                  </select>
                </div>

                <div>
                  <label className="text-on-surface-variant font-bold block mb-1.5 uppercase tracking-wider text-[11px]">
                    Logotip Rasmi (URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://mysite.uz/logo.png"
                    value={clubLogoUrl}
                    onChange={(e) => setClubLogoUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-surface-container-lowest border border-surface-container-highest text-white focus:outline-none focus:border-primary text-sm shadow-inner"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-surface-container-highest flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSavingClub}
                  className="px-6 py-3 rounded-2xl bg-primary hover:bg-primary-fixed text-surface font-display font-black text-sm tracking-wide shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 glow-primary"
                >
                  {isSavingClub ? (
                    <span>Saqlanmoqda...</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">save</span>
                      <span>O'zgarishlarni Saqlash</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Receipt Preview & Subscription Info */}
          <div className="space-y-6">
            {/* DISABLED_RECEIPT_PREVIEW: Chek ko'rinishi namunasi vaqtincha o'chirildi
            <div className="p-5 rounded-3xl bg-surface-container border border-surface-container-highest space-y-4">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">receipt</span>
                <span>Chek Ko'rinishi (Preview)</span>
              </h4>

              <div className="p-4 rounded-2xl bg-white text-zinc-900 font-mono text-[11px] leading-tight space-y-2 shadow-inner border border-zinc-200">
                <div className="text-center space-y-0.5 border-b border-dashed border-zinc-300 pb-2">
                  <div className="font-black text-sm uppercase tracking-tight text-zinc-950">
                    {clubName || 'PLAYBASE CLUB'}
                  </div>
                  {clubPhone && <div className="text-[10px] text-zinc-600">Tel: {clubPhone}</div>}
                  {clubAddress && <div className="text-[10px] text-zinc-600 truncate">{clubAddress}</div>}
                </div>

                <div className="flex justify-between text-[10px] text-zinc-600 pt-1">
                  <span>Chek #A1024</span>
                  <span>29.09.2026 12:45</span>
                </div>

                <div className="py-1 border-t border-b border-dashed border-zinc-300 space-y-1">
                  <div className="flex justify-between">
                    <span>1. PS5 Standart (01:15)</span>
                    <span className="font-bold">35 000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>2. Coca-Cola 0.5L x 2</span>
                    <span className="font-bold">20 000</span>
                  </div>
                </div>

                <div className="flex justify-between font-black text-xs pt-1">
                  <span>JAMI:</span>
                  <span>55 000 {clubCurrency}</span>
                </div>

                <div className="text-center text-[9px] text-zinc-500 pt-1 border-t border-dashed border-zinc-300">
                  Xaridingiz uchun rahmat!
                </div>
              </div>
            </div>
            */}

            {/* Club Subscription Info Card */}
            <div className="p-5 rounded-3xl bg-surface-container-lowest border border-surface-container-highest space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">
                  Tarif & Obuna
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {currentClub?.is_trial ? 'Sinov (Trial)' : 'Faol'}
                </span>
              </div>

              <div className="text-sm font-bold text-white">
                {currentClub?.active_plan_detail?.name || 'PlayBase Pro SaaS'}
              </div>

              <div className="text-xs text-on-surface-variant flex items-center justify-between pt-2 border-t border-surface-container-highest">
                <span>Qolgan muddat:</span>
                <strong className="text-primary font-mono text-sm">
                  {currentClub?.days_left ?? 7} kun
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


