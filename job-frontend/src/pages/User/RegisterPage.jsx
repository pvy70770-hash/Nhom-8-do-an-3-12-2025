import React from 'react';
import RegisterForm from '../../components/auth/RegisterForm';
import './UserPages.css';

function RegisterPage() {
  return (
    <div className="user-page-container">
      <div className="user-page-wrapper">
        <RegisterForm />
      </div>
    </div>
  );
}

export default RegisterPage;