import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { loginUser } from './auth';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      console.log(email,password)
      const token = await loginUser(email, password);
      await SecureStore.setItemAsync('token', token);
      router.replace('/map'); // Redirige l'utilisateur vers la page "map"
    } catch (error) {
      if (error instanceof Error) {
          // Si l'erreur est bien une instance de 'Error', on peut accéder à la propriété 'message'
          Alert.alert('Erreur de connexion', error.message);
      } else {
          // Si l'erreur n'est pas de type 'Error', on gère cela ici
          Alert.alert('Erreur inconnue de la connexion');
      }
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        onChangeText={setEmail}
        value={email}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        onChangeText={setPassword}
        value={password}
        secureTextEntry
      />
      <Button title="Se connecter" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
});
