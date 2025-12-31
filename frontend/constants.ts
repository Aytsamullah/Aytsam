
import { UserRole, User, PatientProfile, Treatment } from './types';

export const MOCK_DOCTOR: User = {
  id: 'doc-001',
  role: UserRole.DOCTOR,
  name: 'Dr. Sarah Mitchell',
  email: 'sarah.m@hospital.com'
};

export const INITIAL_PATIENTS: PatientProfile[] = [
  {
    id: 'pat-001',
    role: UserRole.PATIENT,
    name: 'John Doe',
    email: 'john.doe@email.com',
    cnic: '42101-1234567-1',
    medicalHistory: ['Hypertension', 'Type 2 Diabetes'],
    treatments: [
      {
        id: 'trt-1',
        patientId: 'pat-001',
        doctorId: 'doc-001',
        doctorName: 'Dr. Sarah Mitchell',
        timestamp: '2023-10-15T10:30:00Z',
        diagnosis: 'Routine Checkup',
        medication: 'Metformin 500mg',
        notes: 'Stable blood sugar levels.'
      }
    ]
  },
  {
    id: 'pat-002',
    role: UserRole.PATIENT,
    name: 'Alice Johnson',
    email: 'alice.j@email.com',
    cnic: '35202-7654321-2',
    medicalHistory: ['Asthma'],
    treatments: []
  }
];
