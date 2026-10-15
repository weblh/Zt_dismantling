package com.zuantan.dismantling.dto;

public class LoginResponse {

    private String token;
    private UserInfo user;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public UserInfo getUser() {
        return user;
    }

    public void setUser(UserInfo user) {
        this.user = user;
    }

    public static class UserInfo {
        private Long id;
        private String username;
        private String nickname;
        private String role;
        private java.util.List<String> appPermissions;
        private String dingtalkUserId;
        private String avatar;
        private String phone;
        private String deptIds;
        private String department;
        /** 是否已绑定微信小程序 */
        private Boolean wechatBound;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getNickname() {
            return nickname;
        }

        public void setNickname(String nickname) {
            this.nickname = nickname;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }

        public java.util.List<String> getAppPermissions() {
            return appPermissions;
        }

        public void setAppPermissions(java.util.List<String> appPermissions) {
            this.appPermissions = appPermissions;
        }

        public String getDingtalkUserId() {
            return dingtalkUserId;
        }

        public void setDingtalkUserId(String dingtalkUserId) {
            this.dingtalkUserId = dingtalkUserId;
        }

        public String getAvatar() {
            return avatar;
        }

        public void setAvatar(String avatar) {
            this.avatar = avatar;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getDeptIds() {
            return deptIds;
        }

        public void setDeptIds(String deptIds) {
            this.deptIds = deptIds;
        }

        public String getDepartment() {
            return department;
        }

        public void setDepartment(String department) {
            this.department = department;
        }

        public Boolean getWechatBound() {
            return wechatBound;
        }

        public void setWechatBound(Boolean wechatBound) {
            this.wechatBound = wechatBound;
        }
    }
}
