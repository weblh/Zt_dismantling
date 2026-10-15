package com.zuantan.dismantling.config;

import com.zuantan.dismantling.util.JwtUtil;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Component
public class JwtInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;

    public JwtInterceptor(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        // 小程序可未登录浏览可用表单（仅 GET）
        if (isAnonymousGetAllowed(request)) {
            return true;
        }

        String token = request.getHeader("Authorization");
        if (token == null || !token.startsWith("Bearer ")) {
            writeUnauthorized(response, "未登录或token无效");
            return false;
        }

        token = token.substring(7);
        if (!jwtUtil.validateToken(token)) {
            writeUnauthorized(response, "token已过期");
            return false;
        }

        request.setAttribute("userId", jwtUtil.getUserIdFromToken(token));
        request.setAttribute("username", jwtUtil.getUsernameFromToken(token));
        return true;
    }

    /** 未登录可查看应用/表单列表与表单详情，提交数据仍需登录 */
    private boolean isAnonymousGetAllowed(HttpServletRequest request) {
        if (!"GET".equalsIgnoreCase(request.getMethod())) {
            return false;
        }
        String path = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isEmpty() && path.startsWith(contextPath)) {
            path = path.substring(contextPath.length());
        }
        if ("/api/platform/apps".equals(path) || "/api/platform/forms".equals(path)) {
            return true;
        }
        return path.matches("/api/platform/forms/\\d+")
                || path.matches("/api/platform/forms/by-code/[^/]+");
    }

    private void writeUnauthorized(HttpServletResponse response, String message) throws Exception {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"code\":-1,\"message\":\"" + message + "\"}");
    }
}
