export default {
    extends: ['stylelint-config-standard', 'stylelint-config-recess-order'],
    ignoreFiles: [
        '**/node_modules/**',
        '**/dist/**',
        'demo/dist/**',
        'coverage/**'
    ],
    overrides: [
        {
            files: ['**/*.scss'],
            extends: [
                'stylelint-config-standard-scss',
                'stylelint-config-recommended-scss',
                'stylelint-config-recess-order'
            ]
        },
        {
            files: ['**/*.vue'],
            customSyntax: 'postcss-html',
            extends: [
                'stylelint-config-standard-scss',
                'stylelint-config-recommended-scss',
                'stylelint-config-recess-order'
            ]
        }
    ],
    rules: {
        'no-descending-specificity': null,
        'comment-empty-line-before': null,
        'selector-class-pattern': null,
        'function-no-unknown': [
            true,
            {
                ignoreFunctions: ['/math\\..+/', 'v-bind']
            }
        ],
        'selector-pseudo-element-no-unknown': [
            true,
            {
                ignorePseudoElements: ['v-deep']
            }
        ]
    }
};
