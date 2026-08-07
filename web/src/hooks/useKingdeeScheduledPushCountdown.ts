import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

const PUSH_HOUR = 17;
const PUSH_MINUTE = 0;

export function getNextKingdeePushTime(now = dayjs()) {
  let target = now.hour(PUSH_HOUR).minute(PUSH_MINUTE).second(0).millisecond(0);
  if (!now.isBefore(target)) {
    target = target.add(1, 'day');
  }
  return target;
}

export function formatKingdeePushCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}小时`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}分`);
  parts.push(`${seconds}秒`);
  return parts.join('');
}

export function useKingdeeScheduledPushCountdown(intervalMs = 1000) {
  const [countdownText, setCountdownText] = useState('');
  const [nextPushLabel, setNextPushLabel] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = dayjs();
      const next = getNextKingdeePushTime(now);
      setCountdownText(formatKingdeePushCountdown(next.diff(now)));
      setNextPushLabel(next.isSame(now, 'day') ? '今日 17:00' : '明日 17:00');
    };

    tick();
    const timerId = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(timerId);
  }, [intervalMs]);

  return { countdownText, nextPushLabel };
}
