import js from "@eslint/js"
import tseslint from "typescript-eslint"
import prettierPlugin from "eslint-plugin-prettier"
import prettierConfig from "eslint-config-prettier"
import globals from "globals"

export default [
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**", ".wrangler/"]
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname
      },
      globals: {
        ...globals.node,
        ...globals.worker
      }
    },
    rules: {
      "prettier/prettier": "error",
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ]
    }
  },

  {
    ignores: [
      "dist/**",
      "coverage/**",
      "node_modules/**",
      "worker-configuration.d.ts",
      ".wrangler/**"
    ]
  },

  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    languageOptions: {
      globals: {
        ...globals.node
      }
    },
    rules: {
      "prettier/prettier": "error"
    }
  },

  prettierConfig,

  {
    plugins: {
      prettier: prettierPlugin
    }
  }
]
