import { Alert } from 'antd';
import type { CSSProperties } from 'react';
import { useKingdeeScheduledPushCountdown } from '@/hooks/useKingdeeScheduledPushCountdown';

interface KingdeeScheduledPushAlertProps {
  style?: CSSProperties;
}

export default function KingdeeScheduledPushAlert({ style }: KingdeeScheduledPushAlertProps) {
  const { countdownText, nextPushLabel } = useKingdeeScheduledPushCountdown();

  return (
    <Alert
      type="info"
      showIcon
      style={{ marginBottom: 16, ...style }}
      message="金蝶自动推送提醒"
      description={
        <>
          系统每天下午 17:00 整自动将符合条件的明细合并推送至金蝶；若此前有漏推数据，会在下次执行时按入库日期补推。
          下次推送时间：{nextPushLabel}，距离推送还有 <strong>{countdownText}</strong>。
        </>
      }
    />
  );
}
