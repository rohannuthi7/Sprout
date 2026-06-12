// @expo/vector-icons transitively loads expo-font → expo-asset which reads global.Expo.
// Mock the whole package to a no-op component so tests never touch native asset loading.
jest.mock('@expo/vector-icons', () => {
  const MockIcon = () => null;
  return {
    Ionicons: MockIcon,
    AntDesign: MockIcon,
    Feather: MockIcon,
    MaterialIcons: MockIcon,
    MaterialCommunityIcons: MockIcon,
    FontAwesome: MockIcon,
    FontAwesome5: MockIcon,
    Entypo: MockIcon,
    Octicons: MockIcon,
    SimpleLineIcons: MockIcon,
  };
});

// react-native-gesture-handler requires native modules not available in Jest.
jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return {
    GestureHandlerRootView: View,
    PanGestureHandler: View,
    TapGestureHandler: View,
    LongPressGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    FlingGestureHandler: View,
    State: {},
    Directions: {},
    gestureHandlerRootHOC: jest.fn((component: unknown) => component),
  };
});

// Mock Amplify init so tests don't hit Cognito or need real credentials.
jest.mock('../src/lib/aws', () => ({
  API_BASE_URL: 'https://test.execute-api.us-east-1.amazonaws.com/test',
  default: {},
}));

// Mock aws-amplify/auth so hooks get test stubs without real Cognito calls.
jest.mock('aws-amplify/auth', () => ({
  signIn: jest.fn().mockResolvedValue({ nextStep: { signInStep: 'DONE' } }),
  signUp: jest.fn().mockResolvedValue({ nextStep: { signUpStep: 'DONE' } }),
  confirmSignUp: jest.fn().mockResolvedValue({}),
  signOut: jest.fn().mockResolvedValue({}),
  getCurrentUser: jest.fn().mockResolvedValue({ userId: 'test-owner-id', username: 'test@example.com' }),
  fetchAuthSession: jest.fn().mockResolvedValue({
    tokens: { accessToken: { toString: () => 'test-token' } },
  }),
  Hub: { listen: jest.fn(() => jest.fn()) },
}));

jest.mock('aws-amplify', () => ({
  Amplify: { configure: jest.fn() },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        awsRegion: 'us-east-1',
        cognitoUserPoolId: 'us-east-1_TESTPOOL',
        cognitoUserPoolClientId: 'TEST_CLIENT_ID',
        apiBaseUrl: 'https://test.execute-api.us-east-1.amazonaws.com/test',
      },
    },
  },
}));
