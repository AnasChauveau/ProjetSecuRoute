import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { verifyToken } from './auth';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const user = await verifyToken(token);
          if (user) {
            router.replace('/map'); // Redirige vers la page "map"
          } else {
            router.replace('./login'); // Redirige vers la page de connexion
          }
        } else {
          router.replace('./login'); // Aucun token, on redirige vers login
        }
      } catch (error) {
        console.error('Erreur de vérification du token', error);
        router.replace('./login');
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#f4511e" />
      </View>
    );
  }

  return null;
}
