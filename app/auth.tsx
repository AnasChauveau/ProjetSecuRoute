const API_URL = 'https://730c-37-64-102-102.ngrok-free.app/api'; // Remplacez par l'URL de votre API Strapi

// Fonction pour se connecter et obtenir un token JWT
export const loginUser = async (email: string, password: string): Promise<string> => {
  try {
    console.log()
    const response = await fetch(`${API_URL}/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: email, password })
    });

    const data = await response.json();
    
    if (!response.ok) throw new Error(data.error.message);

    return data.jwt; // C'est le token Bearer à utiliser pour vos requêtes futures
  } catch (error) {
    if (error instanceof Error) {
        throw new Error('Erreur lors de la connexion : ' + error.message);
    } else {
        throw new Error('Erreur inconnue lors de la connexion');
    }
  }
};

// Fonction pour s'enregistrer un nouvel utilisateur
export const registerUser = async (firstName: string, lastName: string, email: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/auth/local/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: `${firstName} ${lastName}`, email, password })
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error.message);
  } catch (error: unknown) {
    if (error instanceof Error) {
        throw new Error('Erreur lors de l\'inscription : ' + error.message);
    } else {
        throw new Error('Erreur inconnue lors de l\'inscription');
    }
  }
};

// Fonction pour vérifier le token de l'utilisateur
export const verifyToken = async (token: string) => {
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Inclure le token dans l'en-tête Authorization
      }
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.message || 'Erreur lors de la vérification du token');

    return data; // Vous pouvez ici renvoyer les informations utilisateur (par exemple, son ID, son email, etc.)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error('Erreur lors de la vérification du token : ' + error.message);
    } else {
      throw new Error('Erreur inconnue lors de la vérification du token');
    }
  }
};
