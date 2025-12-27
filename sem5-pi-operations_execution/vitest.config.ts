import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",

        setupFiles: [
            "src/tests/setup/test-setup.ts"
        ],

        include: [
            "src/tests/**/*.test.ts"
        ]
    }
});