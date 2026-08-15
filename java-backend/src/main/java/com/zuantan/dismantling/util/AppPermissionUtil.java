package com.zuantan.dismantling.util;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public final class AppPermissionUtil {

    public static final String ROLE_SUPER_ADMIN = "SUPER_ADMIN";
    public static final String ROLE_USER = "USER";

    public static final String APP_RECEIPT = "receipt";
    public static final String APP_PRICING = "pricing";
    public static final String APP_INSPECTION = "inspection";

    public static final List<String> ALL_APPS = Collections.unmodifiableList(
            Arrays.asList(APP_RECEIPT, APP_PRICING, APP_INSPECTION));

    private AppPermissionUtil() {
    }

    public static boolean isSuperAdmin(String role) {
        return ROLE_SUPER_ADMIN.equals(role);
    }

    public static List<String> parsePermissions(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            return new ArrayList<>();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .filter(ALL_APPS::contains)
                .distinct()
                .collect(Collectors.toList());
    }

    public static String joinPermissions(List<String> permissions) {
        if (permissions == null || permissions.isEmpty()) {
            return "";
        }
        return permissions.stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .filter(ALL_APPS::contains)
                .distinct()
                .collect(Collectors.joining(","));
    }

    public static List<String> resolveAccessibleApps(String role, String appPermissions) {
        if (isSuperAdmin(role)) {
            return new ArrayList<>(ALL_APPS);
        }
        return parsePermissions(appPermissions);
    }
}
