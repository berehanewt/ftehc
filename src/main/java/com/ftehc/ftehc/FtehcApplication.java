package com.ftehc.ftehc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FtehcApplication {

    public static void main(String[] args) {
        SpringApplication.run(FtehcApplication.class, args);
    }
}

