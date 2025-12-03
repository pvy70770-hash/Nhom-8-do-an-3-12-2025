import React from 'react';
import LoginForm from '../../components/auth/LoginForm';
import './UserPages.css';

function LoginPage() {
  return (
    <div className="user-page-container">
      <div className="user-page-wrapper">
        <LoginForm />
      </div>
    </div>
  );
}

export default LoginPage;