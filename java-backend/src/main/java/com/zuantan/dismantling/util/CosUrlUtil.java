package com.zuantan.dismantling.util;

import com.zuantan.dismantling.config.CosProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 将相对路径拼接为 COS 完整访问地址；已是 http(s)/data/blob 则原样返回。
 */
@Component
public class CosUrlUtil {

    private final CosProperties cosProperties;

    public CosUrlUtil(CosProperties cosProperties) {
        this.cosProperties = cosProperties;
    }

    public String resolve(String path) {
        if (!StringUtils.hasText(path)) {
            return path;
        }
        String trimmed = path.trim();
        if (isAbsoluteOrInline(trimmed)) {
            return trimmed;
        }
        String base = cosProperties.normalizedBaseUrl();
        if (!StringUtils.hasText(base)) {
            return trimmed;
        }
        if (trimmed.startsWith("/")) {
            return base + trimmed;
        }
        return base + "/" + trimmed;
    }

    private static boolean isAbsoluteOrInline(String path) {
        String lower = path.toLowerCase();
        return lower.startsWith("http://")
                || lower.startsWith("https://")
                || lower.startsWith("data:")
                || lower.startsWith("blob:");
    }
}
