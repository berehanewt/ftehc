package com.ftehc.ftehc.documents.storage;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class LocalStorageService implements StorageService {

    @Value("${app.storage.local.upload-dir}")
    private String uploadDir;

    @PostConstruct
    public void init() throws Exception {
        Files.createDirectories(Paths.get(uploadDir));
    }

    @Override
    public String store(MultipartFile file, String prefix) throws Exception {
        String fileKey = prefix + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path destination = Paths.get(uploadDir, fileKey);
        Files.createDirectories(destination.getParent());
        file.transferTo(destination.toFile());
        return fileKey;
    }

    @Override
    public InputStream retrieve(String fileKey) throws Exception {
        Path path = Paths.get(uploadDir, fileKey);
        return Files.newInputStream(path);
    }

    @Override
    public void delete(String fileKey) throws Exception {
        Path path = Paths.get(uploadDir, fileKey);
        Files.deleteIfExists(path);
    }
}

