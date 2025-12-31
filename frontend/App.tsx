
import React, { useState, useEffect } from 'react';
import { UserRole, User, PatientProfile, Treatment, MedicalFile } from './types';
import { MOCK_DOCTOR, INITIAL_PATIENTS } from './constants';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import AuthScreen from './components/AuthScreen';
import { authApi, authUtils } from './services/api';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [doctors, setDoctors] = useState<User[]>([MOCK_DOCTOR]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize app - check for existing auth token
  useEffect(() => {
    const initializeAuth = async () => {
      const token = authUtils.getToken();
      if (token) {
        try {
          // Verify token and get user profile
          const response = await authApi.getProfile();
          if (response.success && response.data) {
            const user = response.data.user;
            setCurrentUser({
              id: user.id,
              role: user.role === 'patient' ? UserRole.PATIENT : UserRole.DOCTOR,
              name: user.name || user.email, // Fallback if name not available
              email: user.email,
              cnic: user.cnic,
              isVerified: user.isVerified
            });
            if (user.role === 'doctor') {
              try {
                const patientsResponse = await authApi.getPatients();
                if (patientsResponse.success && patientsResponse.data) {
                  setPatients(patientsResponse.data.patients);
                }
              } catch (e) {
                console.error('Failed to load patients on init', e);
              }
            }
          }
        } catch (error) {
          // Token is invalid, remove it
          authUtils.removeToken();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const handleLoginSuccess = async (user: User, token: string) => {
    setCurrentUser(user);
    if (user.role === UserRole.DOCTOR) {
      try {
        const response = await authApi.getPatients();
        if (response.success && response.data) {
          setPatients(response.data.patients);
        }
      } catch (error) {
        console.error('Failed to fetch patients:', error);
      }
    }
  };

  const handleSignupSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    // New doctor signup won't have patients yet, but we strictly shouldn't show mock data
    setPatients([]);
  };

  const handleLogout = () => {
    authUtils.logout();
    setCurrentUser(null);
  };

  // Signup is now handled through the AuthScreen component and backend API
  // This function is kept for compatibility but no longer used for authentication

  const addTreatment = async (patientId: string, diagnosis: string, medication: string, notes: string, files: MedicalFile[]) => {
    if (!currentUser || currentUser.role !== UserRole.DOCTOR) return;

    try {
      const response = await authApi.addTreatment({
        patientId,
        diagnosis,
        medication,
        notes,
        files
      });

      if (response.success) {
        // Refresh patients list to show new treatment
        const refreshResponse = await authApi.getPatients();
        if (refreshResponse.success && refreshResponse.data) {
          setPatients(refreshResponse.data.patients);
        }
      }
    } catch (error) {
      console.error('Failed to add treatment:', error);
      alert('Failed to save treatment record. Please try again.');
    }
  };

  const deleteTreatment = (patientId: string, treatmentId: string) => {
    // Security: Only patients can delete their own records in this specific implementation
    if (!currentUser || currentUser.role !== UserRole.PATIENT) return;

    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return { ...p, treatments: p.treatments.filter(t => t.id !== treatmentId) };
      }
      return p;
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="flex-grow container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading MedChain...</p>
            </div>
          </div>
        ) : currentUser ? (
          <Dashboard
            user={currentUser}
            patients={patients}
            onAddTreatment={addTreatment}
            onDeleteTreatment={deleteTreatment}
          />
        ) : (
          <AuthScreen onLoginSuccess={handleLoginSuccess} onSignupSuccess={handleSignupSuccess} />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-slate-500 text-sm">
        &copy; 2024 MedChain Systems. Verified Professional Healthcare Environment.
      </footer>
    </div>
  );
};

export default App;
