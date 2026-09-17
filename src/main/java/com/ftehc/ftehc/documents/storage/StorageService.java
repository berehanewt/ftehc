package com.ftehc.ftehc.documents.storage;

import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

public interface StorageService {
    String store(MultipartFile file, String prefix) throws Exception;
    InputStream retrieve(String fileKey) throws Exception;
    void delete(String fileKey) throws Exception;
}

