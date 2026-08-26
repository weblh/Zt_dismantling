declare global {
  interface Window {
    dd?: {
      ready: (fn: () => void) => void;
      error: (fn: (err: unknown) => void) => void;
      runtime?: {
        permission?: {
          requestAuthCode: (opts: {
            corpId: string;
            onSuccess: (result: { code: string }) => void;
            onFail: (err: unknown) => void;
          }) => void;
        };
      };
    };
  }
}

export function isDingTalkEnv() {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('dingtalk') || typeof window.dd !== 'undefined';
}

/**
 * 钉钉 JSAPI 免登 authCode。
 * 需在钉钉工作台打开，并配置 corpId（可从 /auth/dingtalk/qr-config 获取）。
 */
export async function requestDingTalkAuthCode(corpId?: string): Promise<string> {
  const cid =
    corpId ||
    (import.meta.env.VITE_DINGTALK_CORP_ID as string | undefined) ||
    'dingcb1f88f31ec617c6f5bf40eda33b7ba0';

  if (!window.dd?.runtime?.permission?.requestAuthCode) {
    await loadDingTalkJsapi();
  }

  return new Promise((resolve, reject) => {
    if (!window.dd?.runtime?.permission?.requestAuthCode) {
      reject(new Error('当前环境不支持钉钉 JSAPI，请使用扫码登录'));
      return;
    }
    window.dd.ready(() => {
      window.dd!.runtime!.permission!.requestAuthCode({
        corpId: cid,
        onSuccess: (result) => resolve(result.code),
        onFail: (err) => reject(err),
      });
    });
    window.dd.error?.(reject);
  });
}

function loadDingTalkJsapi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.dd) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://g.alicdn.com/dingding/dingtalk-jsapi/3.0.25/dingtalk.open.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('加载钉钉 JSAPI 失败'));
    document.head.appendChild(script);
  });
}
