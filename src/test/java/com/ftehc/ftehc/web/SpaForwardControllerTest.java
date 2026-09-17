package com.ftehc.ftehc.web;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class SpaForwardControllerTest {

    @Test
    void forwardsToBundledIndexWhenFrontendIsPackaged() {
        SpaForwardController controller = new ExistingFrontendController("http://localhost:4200");

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/login");

        assertThat(controller.spaRoutes(request)).isEqualTo("forward:/index.html");
    }

    @Test
    void redirectsToFrontendDevServerWhenNoBundledIndexExists() {
        SpaForwardController controller = new MissingFrontendController("http://localhost:4200");

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/login");
        request.setQueryString("next=%2Fadmin");

        assertThat(controller.spaRoutes(request))
                .isEqualTo("redirect:http://localhost:4200/login?next=%2Fadmin");
    }

    private static final class ExistingFrontendController extends SpaForwardController {
        private ExistingFrontendController(String frontendDevUrl) {
            super(frontendDevUrl);
        }

        @Override
        boolean hasBundledFrontend() {
            return true;
        }
    }

    private static final class MissingFrontendController extends SpaForwardController {
        private MissingFrontendController(String frontendDevUrl) {
            super(frontendDevUrl);
        }

        @Override
        boolean hasBundledFrontend() {
            return false;
        }
    }
}

