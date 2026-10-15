package com.zuantan.dismantling.util;

import org.springframework.util.StringUtils;

/** 手机号归一化（小程序 / 钉钉通讯录共用） */
public final class PhoneUtil {

    private PhoneUtil() {
    }

    public static String normalize(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        String p = raw.trim().replace(" ", "").replace("-", "");
        if (p.startsWith("+86")) {
            p = p.substring(3);
        } else if (p.startsWith("86") && p.length() == 13) {
            p = p.substring(2);
        }
        if (p.matches("1\\d{10}")) {
            return p;
        }
        return StringUtils.hasText(p) ? p : null;
    }
}
