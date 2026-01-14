import { useState } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import { AuthPage } from './components/auth/AuthPage';
import { KYCFlow } from './components/kyc/KYCFlow';
import { BankAccountSetup } from './components/user/BankAccountSetup';
import { UserDashboard } from './components/user/UserDashboard';
import { ApiDashboard } from './components/developer/ApiDashboard';
import { ComplianceDashboard } from './components/compliance/ComplianceDashboard';
import { BackgroundWrapper } from './components/ui/BackgroundWrapper';
import { Toaster } from './components/ui/sonner';

type View = 'landing' | 'auth' | 'kyc' | 'bank-setup' | 'user' | 'api-dashboard' | 'compliance';
type UserRole = 'user' | 'compliance' | null;

interface BankAccount {
  id: string;
  accountNumber: string;
  accountHolderName: string;
  ifscCode: string;
  bankName: string;
  accountType: 'savings' | 'current';
  isPrimary: boolean;
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [defaultDashboardTab, setDefaultDashboardTab] = useState<'send'>('send');
  const [authTargetView, setAuthTargetView] = useState<'user' | 'api-dashboard'>('user');

  const handleAuth = (role: 'user' | 'compliance', userData?: any) => {
    setUserRole(role);
    if (userData) {
      setCurrentUser(userData);
      // Also update KYC status from user data if available
      if (userData.kycStatus) setKycStatus(userData.kycStatus);
      if (userData.bankAccounts) setBankAccounts(userData.bankAccounts || []);

      if (role === 'compliance') {
        setCurrentView('compliance');
      } else {
        // Route based on KYC status
        if (userData.kycStatus === 'pending' || userData.kycStatus === 'rejected') {
          setCurrentView('kyc');
        } else {
          setCurrentView('user');
        }
      }
    } else {
      // Fallback for mock/dev flows if no userData provided
      if (role === 'compliance') {
        setCurrentView('compliance');
      } else {
        setCurrentView('user');
      }
    }
  };

  // ... (rest of handlers)

  // ... (inside return)

  const handleKYCComplete = () => {
    setKycStatus('approved');
    setCurrentView('bank-setup');
  };

  const handleBankSetupComplete = (accounts: BankAccount[]) => {
    setBankAccounts(accounts);
    setCurrentView('user');
  };

  const handleBankSetupSkip = () => {
    setCurrentView('user');
  };

  const handleLogout = () => {
    setCurrentView('landing');
    setUserRole(null);
    setKycStatus('pending');
    setBankAccounts([]);
  };

  return (
    <BackgroundWrapper>
      {currentView === 'landing' && (
        <LandingPage
          onGetStarted={() => {
            setDefaultDashboardTab('send');
            setCurrentView('auth');
          }}
          onGetApiKeys={() => {
            setCurrentView('api-dashboard');
          }}
        />
      )}
      {currentView === 'auth' && (
        <AuthPage
          onAuth={handleAuth}
          onBack={() => setCurrentView('landing')}
          isDeveloper={defaultDashboardTab === 'api'}
        />
      )}
      {currentView === 'kyc' && (
        <KYCFlow
          user={currentUser}
          onComplete={handleKYCComplete}
          onCancel={handleLogout}
        />
      )}
      {currentView === 'bank-setup' && (
        <BankAccountSetup
          onComplete={handleBankSetupComplete}
          onSkip={handleBankSetupSkip}
        />
      )}
      {currentView === 'user' && (
        <UserDashboard
          onLogout={handleLogout}
          bankAccounts={bankAccounts}
          initialTab={defaultDashboardTab}
          user={currentUser}
        />
      )}
      {currentView === 'api-dashboard' && (
        <ApiDashboard
          onLogout={handleLogout}
          onBack={() => setCurrentView('user')}
        />
      )}
      {currentView === 'compliance' && (
        <ComplianceDashboard onLogout={handleLogout} />
      )}
      <Toaster />
    </BackgroundWrapper>
  );
}