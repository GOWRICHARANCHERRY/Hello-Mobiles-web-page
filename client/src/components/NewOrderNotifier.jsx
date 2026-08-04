import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';

const POLL_INTERVAL = 15000;
const STORAGE_KEY = 'hm_last_order_id';

function beep(ctx, freq, start, duration) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function playAlarmCycle(ctx) {
  const now = ctx.currentTime;
  [880, 880, 880, 1175].forEach((freq, i) => beep(ctx, freq, now + i * 0.18, 0.12));
}

export default function NewOrderNotifier() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const audioCtxRef = useRef(null);
  const alarmIntervalRef = useRef(null);
  const toastIdRef = useRef(null);
  const lastIdRef = useRef(null);

  const stopAlarm = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
  };

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'employee')) return undefined;

    lastIdRef.current = localStorage.getItem(STORAGE_KEY) || null;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    let active = true;

    const checkLatest = async () => {
      try {
        const { data } = await api.get('/orders/latest');
        if (!active) return;
        if (!data) return;

        const id = data._id;
        if (!lastIdRef.current) {
          lastIdRef.current = id;
          localStorage.setItem(STORAGE_KEY, id);
          return;
        }
        if (id !== lastIdRef.current) {
          lastIdRef.current = id;
          localStorage.setItem(STORAGE_KEY, id);

          const total = `₹${Number(data.total || 0).toLocaleString('en-IN')}`;
          const title = t('comp.newOrderTitle');
          const message = t('comp.newOrderBody', {
            orderNumber: data.orderNumber,
            total,
          });

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: message, icon: '/logo.png' });
          }

          toastIdRef.current = toast.custom(
            (toastEl) => (
              <div
                onClick={() => {
                  stopAlarm();
                  toast.dismiss(toastEl.id);
                }}
                className="cursor-pointer bg-white rounded-lg shadow-lg border border-gold-400 p-4 w-80"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-xl">🔔</div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{title}</p>
                    <p className="text-sm text-gray-600">{message}</p>
                  </div>
                  <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded whitespace-nowrap">
                    {t('comp.newOrderStop')}
                  </span>
                </div>
              </div>
            ),
            { duration: Infinity, position: 'top-right' }
          );

          try {
            if (!audioCtxRef.current) {
              audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') await ctx.resume();
            playAlarmCycle(ctx);
            alarmIntervalRef.current = setInterval(() => {
              if (audioCtxRef.current) playAlarmCycle(audioCtxRef.current);
            }, 2600);
          } catch (e) {
            console.warn('[NewOrderNotifier] audio unavailable:', e);
          }
        }
      } catch (e) {
        // network errors / not authed — ignore, keep polling
      }
    };

    checkLatest();
    const poll = setInterval(checkLatest, POLL_INTERVAL);
    return () => {
      active = false;
      clearInterval(poll);
      stopAlarm();
    };
  }, [user, t]);

  return null;
}
