import { useCallback, useEffect, useState } from 'react';
import {
  getEnabledKingdeeAccounts,
  getDefaultKingdeeAccount,
  type KingdeeAccountConfig,
} from '@/api/kingdee';

export function useKingdeeAccountSelect() {
  const [accounts, setAccounts] = useState<KingdeeAccountConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>();

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const [enabledRes, defaultRes] = await Promise.all([
        getEnabledKingdeeAccounts(),
        getDefaultKingdeeAccount().catch(() => null),
      ]);
      const enabled = enabledRes.data;
      setAccounts(enabled);
      const defaultAccount = defaultRes?.data;
      if (defaultAccount && enabled.some((item) => item.id === defaultAccount.id)) {
        setSelectedAccountId(defaultAccount.id);
      } else if (enabled.length > 0) {
        setSelectedAccountId(enabled[0].id);
      } else {
        setSelectedAccountId(undefined);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const selectedAccount = accounts.find((item) => item.id === selectedAccountId);

  return {
    accounts,
    loading,
    selectedAccountId,
    setSelectedAccountId,
    selectedAccount,
    reloadAccounts: loadAccounts,
  };
}

export function applyKingdeeAccountToVoucherForm(
  account: KingdeeAccountConfig | undefined,
  form: { setFieldsValue: (values: Record<string, unknown>) => void },
) {
  if (!account) return;
  const now = new Date();
  const fallbackPeriod = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  form.setFieldsValue({
    accountId: account.id,
    formId: account.defaultFormId || 'GL_VOUCHER',
    accountingPeriod: account.defaultAccountingPeriod || fallbackPeriod,
    orgCompanyCode: account.orgCompanyCode || '',
  });
}

export function applyKingdeeAccountToSupplierForm(
  account: KingdeeAccountConfig | undefined,
  form: { setFieldsValue: (values: Record<string, unknown>) => void },
) {
  if (!account) return;
  form.setFieldsValue({
    accountId: account.id,
    useOrgCode: account.useOrgCode || '',
  });
}
