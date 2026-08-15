package com.zuantan.dismantling.vo;

public class AttachmentFileVO {

    private String fileId;
    private String spaceId;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private boolean previewable;

    public String getFileId() {
        return fileId;
    }

    public void setFileId(String fileId) {
        this.fileId = fileId;
    }

    public String getSpaceId() {
        return spaceId;
    }

    public void setSpaceId(String spaceId) {
        this.spaceId = spaceId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public boolean isPreviewable() {
        return previewable;
    }

    public void setPreviewable(boolean previewable) {
        this.previewable = previewable;
    }
}
