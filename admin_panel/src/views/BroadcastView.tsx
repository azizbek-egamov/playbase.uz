import React, { useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { Header } from '../components/Header';
import {
  Send,
  Users,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export const BroadcastView: React.FC = () => {
  const { sendBroadcast, isLoading } = useAdminStore();
  const [target, setTarget] = useState<string>('ALL');
  const [message, setMessage] = useState<string>(
    `🎮 <b>Hurmatli PlayBase hamkorimiz!</b>\n\n` +
    `Tizimimizda yangi yangilanishlar ishga tushirildi. Qulayliklar va yangi imkoniyatlar bilan tanishish uchun ilovaga kiring!\n\n` +
    `<i>Savollar bo'lsa @playbase_support ga murojaat qiling.</i>`
  );
  const [lastResult, setLastResult] = useState<any>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (confirm("Haqiqatan ham ushbu xabarnomani tanlangan klub egalariga yubormoqchimisiz?")) {
      const res = await sendBroadcast({
        target,
        message,
        parse_mode: 'HTML',
      });
      if (res.success && res.data) {
        setLastResult(res.data);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-dim pb-12">
      <Header
        title="Telegram Ommaviy Xabarnoma (Broadcast)"
        subtitle="Aiogram Boti orqali klub egalariga e'lonlar, aksiyalar va yangilanishlarni yuborish"
      />

      <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form (7 cols) */}
          <div className="lg:col-span-7 bg-surface-container border border-surface-container-highest rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-display font-black text-white text-base">Xabarnoma Yaratish</h3>

            <form onSubmit={handleSend} className="space-y-4 text-xs">
              {/* Target Group */}
              <div>
                <label className="text-on-surface-variant font-bold block mb-1.5">
                  Qabul qiluvchilar auditoriyasi
                </label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-surface-container-lowest border border-surface-container-highest text-white text-xs font-bold focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="ALL">📢 Barcha Klub Egalariga (Hammasi)</option>
                  <option value="ACTIVE">💎 Faol Pullik Obunachilarga</option>
                  <option value="TRIAL">⏳ Sinov (Trial) Davridagi Klublarga</option>
                  <option value="EXPIRED">⚠️ Obunasi Tugagan Klublarga (To'lov eslatmasi)</option>
                </select>
              </div>

              {/* Message Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-on-surface-variant font-bold block">
                    Xabar Matni (HTML qo'llab-quvvatlanadi)
                  </label>
                  <span className="text-[10px] text-primary font-mono font-bold">
                    &lt;b&gt;, &lt;i&gt;, &lt;a&gt; teglari
                  </span>
                </div>
                <textarea
                  rows={8}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-highest text-white text-xs font-mono focus:outline-none focus:border-primary resize-none leading-relaxed"
                  placeholder="Xabarni shu yerga yozing..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary-fixed text-surface font-display font-black text-sm tracking-wide shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 glow-primary active:scale-95"
              >
                {isLoading ? (
                  <span>Yuborilmoqda...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Telegram Bot orqali Tarqatish</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Live Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-surface-container border border-surface-container-highest rounded-3xl p-6 shadow-xl">
              <h4 className="font-display font-bold text-white text-sm mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Telegram Jonli Ko'rinishi</span>
              </h4>

              {/* Telegram Message Mockup Card */}
              <div className="p-4 rounded-2xl bg-[#17212b] border border-cyan-500/20 text-white text-xs shadow-inner space-y-2">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-surface font-black text-[10px]">
                    PB
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">PlayBase Bot</div>
                    <div className="text-[9px] text-cyan-400">Official Notification</div>
                  </div>
                </div>

                <div
                  className="text-gray-200 text-xs whitespace-pre-wrap leading-relaxed pt-1"
                  dangerouslySetInnerHTML={{ __html: message.replace(/\n/g, '<br/>') }}
                />
              </div>
            </div>

            {/* Last Result Box */}
            {lastResult && (
              <div className="p-5 rounded-3xl bg-surface-container border border-primary/40 shadow-xl space-y-2">
                <div className="font-bold text-primary text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xabarnoma Yakuni</span>
                </div>
                <div className="text-xs text-white">
                  Jami auditoriya: <b>{lastResult.recipients_count} ta</b>
                </div>
                <div className="text-xs text-primary">
                  Muvaffaqiyatli yetkazildi: <b>{lastResult.sent_count} ta</b>
                </div>
                {lastResult.failed_count > 0 && (
                  <div className="text-xs text-rose-400">
                    Xatolik: <b>{lastResult.failed_count} ta</b>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
