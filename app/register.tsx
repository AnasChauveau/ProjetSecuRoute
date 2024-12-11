import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { registerUser } from './auth';
import { router } from 'expo-router';

const Register: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
        await registerUser(firstName, lastName, email, password);
        Alert.alert('Inscription réussie !', 'Vous pouvez maintenant vous connecter.');
    } catch (error) {
        if (error instanceof Error) {
            // Si l'erreur est bien une instance de 'Error', on peut accéder à la propriété 'message'
            Alert.alert('Erreur d\'inscription', error.message);
        } else {
            // Si l'erreur n'est pas de type 'Error', on gère cela ici
            Alert.alert('Erreur inconnue de l\'inscription');
        }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inscription</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Prénom" 
        value={firstName} 
        onChangeText={setFirstName} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Nom" 
        value={lastName} 
        onChangeText={setLastName} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        keyboardType="email-address"
      />
      <TextInput 
        style={styles.input} 
        placeholder="Mot de passe" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />

      <Button title="S'inscrire" onPress={handleRegister} />

      <View style={styles.registerContainer}>
        <Text>Vous avez déjà un compte ?</Text>
        <Button title="Créer un compte" onPress={() => router.navigate("./login")} />
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  registerContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
});

export default Register;
