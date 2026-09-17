package com.ftehc.ftehc.web;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Controller;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.util.UriComponentsBuilder;

@Controller
public class SpaForwardController {

    private final String frontendDevUrl;

    public SpaForwardController(@Value("${app.frontend.dev-url:}") String frontendDevUrl) {
        this.frontendDevUrl = frontendDevUrl;
    }

    @GetMapping({
            "/",
            "/login",
            "/forgot-password",
            "/reset-password/**",
            "/admissions",
            "/our-school",
            "/contact",
            "/admin",
            "/admin/**",
            "/teacher",
            "/teacher/**",
            "/student",
            "/student/**",
            "/guardian",
            "/guardian/**",
            "/unauthorized",
            "/not-found"
    })
    public String spaRoutes(HttpServletRequest request) {
        if (hasBundledFrontend()) {
            return "forward:/index.html";
        }

        if (StringUtils.hasText(frontendDevUrl)) {
            return "redirect:" + UriComponentsBuilder
                    .fromUriString(frontendDevUrl)
                    .path(request.getRequestURI())
                    .query(request.getQueryString())
                    .build(true)
                    .toUriString();
        }

        return "forward:/index.html";
    }

    boolean hasBundledFrontend() {
        Resource indexHtml = new ClassPathResource("static/index.html");
        return indexHtml.exists();
    }
}

