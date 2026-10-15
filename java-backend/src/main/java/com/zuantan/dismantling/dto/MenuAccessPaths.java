package com.zuantan.dismantling.dto;

import java.util.ArrayList;
import java.util.List;

/** 前端路由守卫用的路径权限快照 */
public class MenuAccessPaths {

    /** 当前用户可访问的路由 path（以 / 开头） */
    private List<String> allowedPaths = new ArrayList<>();
    /** 系统已登记、需鉴权的路由 path；不在此集合内的页面登录后仍可访问（兼容未挂菜单的旧页） */
    private List<String> protectedPaths = new ArrayList<>();

    public List<String> getAllowedPaths() {
        return allowedPaths;
    }

    public void setAllowedPaths(List<String> allowedPaths) {
        this.allowedPaths = allowedPaths;
    }

    public List<String> getProtectedPaths() {
        return protectedPaths;
    }

    public void setProtectedPaths(List<String> protectedPaths) {
        this.protectedPaths = protectedPaths;
    }
}
