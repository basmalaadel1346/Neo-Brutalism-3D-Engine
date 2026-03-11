export default {
    testEnvironment: 'jsdom',
    collectCoverageFrom: [
        'js/**/*.js',
        '!js/main.js'
    ],
    coveragePathIgnorePatterns: ['/node_modules/'],
    moduleFileExtensions: ['js'],
    testMatch: ['**/__tests__/**/*.test.js'],
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
