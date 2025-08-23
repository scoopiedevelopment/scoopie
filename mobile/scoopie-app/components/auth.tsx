import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

// Types
interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
  };
}

// API Configuration from environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://scoopie.manishdashsharma.site/api';

// Mock API for development - Remove this when you have a real API
const mockAuthAPI = {
  register: async (email: string, password: string): Promise<AuthResponse> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    // Mock successful registration
    return {
      success: true,
      message: 'Registration successful',
    };
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    // Mock successful login with token
    return {
      success: true,
      message: 'Login successful',
      data: {
        accessToken: 'mock-jwt-token-' + Date.now(),
      },
    };
  },
};

// Real API Functions (use when you have a backend)
const realAuthAPI = {
  register: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      let errorMessage = 'Registration failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      let errorMessage = 'Login failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },
};

// Switch between mock and real API
const USE_MOCK_API = false; // Using real API from environment
const authAPI = USE_MOCK_API ? mockAuthAPI : realAuthAPI;

// Validation Functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

// LOGIN SCREEN - Minimalist Design
export const LoginScreen: React.FC<{ onLoginSuccess: () => void; onSwitchToRegister: () => void }> = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await authAPI.login(email.trim(), password);
      
      if (response.data?.accessToken) {
        await AsyncStorage.setItem('accessToken', response.data.accessToken);
        onLoginSuccess();
      }
    } catch (error) {
      Alert.alert('Login Failed', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={loginStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={loginStyles.keyboardView}
      >
        <View style={loginStyles.header}>
          <Text style={loginStyles.welcomeText}>Welcome</Text>
          <Text style={loginStyles.welcomeText}>Back</Text>
          <Text style={loginStyles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={loginStyles.formContainer}>
          <View style={loginStyles.inputGroup}>
            <Text style={loginStyles.inputLabel}>Email Address</Text>
            <TextInput
              style={[loginStyles.input, errors.email && loginStyles.inputError]}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && <Text style={loginStyles.errorText}>{errors.email}</Text>}
          </View>

          <View style={loginStyles.inputGroup}>
            <Text style={loginStyles.inputLabel}>Password</Text>
            <TextInput
              style={[loginStyles.input, errors.password && loginStyles.inputError]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
            />
            {errors.password && <Text style={loginStyles.errorText}>{errors.password}</Text>}
          </View>

          <TouchableOpacity
            style={[loginStyles.loginButton, loading && loginStyles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={loginStyles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={loginStyles.footer}>
          <Text style={loginStyles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={onSwitchToRegister}>
            <Text style={loginStyles.signUpLink}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

// REGISTER SCREEN - Card-based Design
export const RegisterScreen: React.FC<{ onRegisterSuccess: () => void; onSwitchToLogin: () => void }> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await authAPI.register(email.trim(), password);
      Alert.alert(
        '🎉 Success!',
        'Your account has been created successfully! Please sign in to continue.',
        [{ text: 'Continue', onPress: onRegisterSuccess }]
      );
    } catch (error) {
      Alert.alert('Registration Failed', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={registerStyles.container} showsVerticalScrollIndicator={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={registerStyles.keyboardView}
      >
        <View style={registerStyles.header}>
          <View style={registerStyles.iconContainer}>
            <Text style={registerStyles.icon}>👋</Text>
          </View>
          <Text style={registerStyles.title}>Join Us Today</Text>
          <Text style={registerStyles.description}>
            Create your account and start your journey with us
          </Text>
        </View>

        <View style={registerStyles.card}>
          <View style={registerStyles.formSection}>
            <Text style={registerStyles.sectionTitle}>Account Information</Text>
            
            <View style={registerStyles.inputContainer}>
              <View style={registerStyles.inputWrapper}>
                <Text style={registerStyles.label}>📧</Text>
                <TextInput
                  style={[registerStyles.input, errors.email && registerStyles.inputError]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email address"
                  placeholderTextColor="#aaa"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && <Text style={registerStyles.errorText}>{errors.email}</Text>}
            </View>

            <View style={registerStyles.inputContainer}>
              <View style={registerStyles.inputWrapper}>
                <Text style={registerStyles.label}>🔒</Text>
                <TextInput
                  style={[registerStyles.input, errors.password && registerStyles.inputError]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  placeholderTextColor="#aaa"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              {errors.password && <Text style={registerStyles.errorText}>{errors.password}</Text>}
            </View>

            <View style={registerStyles.inputContainer}>
              <View style={registerStyles.inputWrapper}>
                <Text style={registerStyles.label}>🔑</Text>
                <TextInput
                  style={[registerStyles.input, errors.confirmPassword && registerStyles.inputError]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  placeholderTextColor="#aaa"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              {errors.confirmPassword && <Text style={registerStyles.errorText}>{errors.confirmPassword}</Text>}
            </View>
          </View>

          <TouchableOpacity
            style={[registerStyles.createButton, loading && registerStyles.createButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <View style={registerStyles.buttonContent}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={registerStyles.createButtonText}>Create Account</Text>
                  <Text style={registerStyles.buttonArrow}>→</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={registerStyles.footer}>
          <View style={registerStyles.divider}>
            <View style={registerStyles.dividerLine} />
            <Text style={registerStyles.dividerText}>Already have an account?</Text>
            <View style={registerStyles.dividerLine} />
          </View>
          
          <TouchableOpacity
            style={registerStyles.signInButton}
            onPress={onSwitchToLogin}
          >
            <Text style={registerStyles.signInButtonText}>Sign In Instead</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

// LOGIN SCREEN STYLES - Minimalist
const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    paddingTop: height * 0.12,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'flex-start',
  },
  welcomeText: {
    fontSize: 42,
    fontWeight: '300',
    color: '#fff',
    lineHeight: 48,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    marginTop: -50,
  },
  inputGroup: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingVertical: 15,
    fontSize: 16,
    color: '#fff',
  },
  inputError: {
    borderBottomColor: '#ff6b6b',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 5,
  },
  loginButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
  },
  loginButtonDisabled: {
    backgroundColor: '#666',
  },
  loginButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#888',
    fontSize: 14,
  },
  signUpLink: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
});

// REGISTER SCREEN STYLES - Card-based
const registerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  keyboardView: {
    minHeight: height,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.08,
    paddingBottom: 30,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  formSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
  },
  label: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#2c3e50',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  createButton: {
    backgroundColor: '#3498db',
    borderRadius: 15,
    paddingVertical: 18,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonDisabled: {
    backgroundColor: '#bdc3c7',
    shadowOpacity: 0.1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonArrow: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    paddingBottom: 30,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#bdc3c7',
  },
  dividerText: {
    color: '#7f8c8d',
    fontSize: 14,
    marginHorizontal: 15,
  },
  signInButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3498db',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  signInButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '600',
  },
});

export const AuthNavigator: React.FC<{ onAuthSuccess: () => void }> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);

  const handleRegisterSuccess = () => {
    setIsLogin(true); // Switch to login after successful registration
  };

  if (isLogin) {
    return (
      <LoginScreen
        onLoginSuccess={onAuthSuccess}
        onSwitchToRegister={() => setIsLogin(false)}
      />
    );
  } else {
    return (
      <RegisterScreen
        onRegisterSuccess={handleRegisterSuccess}
        onSwitchToLogin={() => setIsLogin(true)}
      />
    );
  }
};