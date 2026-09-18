import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import pluginA11yVue from 'eslint-plugin-vuejs-accessibility';
import jsdoc from 'eslint-plugin-jsdoc';
import prettier from '@vue/eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default [
    js.configs.recommended,
    jsdoc.configs['flat/recommended'],
    ...pluginVue.configs['flat/essential'],
    ...pluginVue.configs['flat/strongly-recommended'],
    ...pluginA11yVue.configs['flat/recommended'],
    prettier,
    {
        files: [
            'layerge/**/*.{js,cjs,mjs,ts,vue}',
            'demo/src/**/*.{js,cjs,mjs,vue}'
        ],
        languageOptions: {
            sourceType: 'module',
            parserOptions: {ecmaVersion: 'latest'}
        },
        plugins: {jsdoc},
        rules: {
            'vue/html-indent': ['error', 4],
            'vue/no-multiple-template-root': 0,
            'vue/multi-word-component-names': 0,
            'vue/object-curly-spacing': 0,
            'vue/comma-dangle': 0,
            'vue/max-len': 0,
            'vue/no-template-shadow': 'off',

            'vuejs-accessibility/form-control-has-label': 0,
            'vuejs-accessibility/label-has-for': 0,

            // 整形の権威は prettier 単独とする。
            // 以前は core の indent ルールと二重管理になっており、
            // eslint --fix（pnpm lint）が出力した整形結果を
            // 同じ eslint の indent ルールが error として弾く状態だった。
            // 検査を実効化するため warn ではなく error で運用する。
            'prettier/prettier': 'error',

            semi: [2, 'always'],
            'object-curly-spacing': [2, 'never'],
            'comma-dangle': [2, 'never'],
            'max-len': 0,
            yoda: 0,
            'no-multiple-empty-lines': [
                2,
                {
                    max: 3
                }
            ],

            'react/jsx-no-bind': 'off',

            // console 出力はライブラリの設計された機能（warnDev / DecisionTrace の
            // ダンプ / debug:true 時のログ）であるため allow で許可する。
            // NODE_ENV に依存させると lint 結果が環境で変わり、未使用と判定された
            // eslint-disable ディレクティブが自動削除される事故が起きるため固定値とする。
            // 紛れ込んだ console.log だけを捕捉する。
            'no-console': ['warn', {allow: ['warn', 'info', 'debug', 'error']}],
            'no-debugger': 'warn',
            'linebreak-style': 0,

            'jsdoc/require-description': 'warn',
            'jsdoc/require-param-description': 'warn',
            'jsdoc/require-returns-description': 'warn',
            'jsdoc/require-throws': 'warn',
            'jsdoc/require-returns': 'warn',
            'jsdoc/require-param': 'warn',
            'jsdoc/check-tag-names': 'warn',
            'jsdoc/no-undefined-types': 'warn',

            'no-param-reassign': [
                'error',
                {
                    props: false
                }
            ]
        }
    },
    // 段階 6: <script setup lang="ts"> を解釈できるよう、.vue の script ブロックに
    // TypeScript パーサを割り当てる（vue-eslint-parser の parserOptions.parser）。
    {
        files: ['layerge/**/*.vue'],
        languageOptions: {
            parserOptions: {
                parser: tseslint.parser
            }
        },
        plugins: {'@typescript-eslint': tseslint.plugin},
        rules: {
            // 型注釈中の識別子を base の no-unused-vars が未使用と誤検出するため、
            // .ts と同じく TypeScript 版に委ねる。any の扱いも .ts と揃える（仕様書 6-1）
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/no-explicit-any': 'error'
        }
    },

    // TypeScript 移行（docs/spec-typescript-migration.ja.md 段階 0）。
    // 移行対象は layerge/ のみで、demo / tests / e2e は .js のまま（仕様書 5-3）。
    // 型情報を要する recommendedTypeChecked は導入していない。必要になった段階で判断する。
    ...tseslint.config({
        files: ['layerge/**/*.ts'],
        extends: [tseslint.configs.recommended],
        rules: {
            // JSDoc の @param / @returns は型の重複になるため、.ts では型の記載を求めない。
            // 説明文の規約は移行完了後に再定義する（仕様書 5-2）。
            'jsdoc/require-param-type': 'off',
            'jsdoc/require-returns-type': 'off'
        }
    }),
    {
        files: ['**/*.vue'],
        rules: {
            // ESLint 10's no-useless-assignment rule does not account for
            // <script setup> bindings consumed from the template.
            'no-useless-assignment': 'off'
        }
    },
    {
        ignores: [
            '**/*.config.{js,cjs,mjs}',
            '**/node_modules/**',
            '**/dist/**',
            'demo/dist/**',
            'coverage/**'
        ]
    }
];
