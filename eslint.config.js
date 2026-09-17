import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import pluginA11yVue from 'eslint-plugin-vuejs-accessibility';
import jsdoc from 'eslint-plugin-jsdoc';
import prettier from '@vue/eslint-config-prettier';

export default [
    js.configs.recommended,
    jsdoc.configs['flat/recommended'],
    ...pluginVue.configs['flat/essential'],
    ...pluginVue.configs['flat/strongly-recommended'],
    ...pluginA11yVue.configs['flat/recommended'],
    prettier,
    {
        files: [
            'layerge/**/*.{js,cjs,mjs,vue}',
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
