module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|nativewind|react-native-reanimated|@tanstack/react-query|@react-native-async-storage/async-storage|date-fns|zustand|react-hook-form|@hookform/resolvers|zod|axios|expo-modules-core|expo-camera|expo-location|expo-notifications|expo-secure-store|expo-file-system|expo-sharing|expo-device|expo-network|expo-local-authentication|expo-image-picker|@react-native-community/datetimepicker|react-native-maps|react-native-safe-area-context|react-native-screens|react-native-gesture-handler|react-native-reanimated)",
  ],
  setupFiles: ["./src/__tests__/setup.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    "^@screens/(.*)$": "<rootDir>/src/screens/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@store/(.*)$": "<rootDir>/src/store/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/index.ts",
    "!src/navigation/**",
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
