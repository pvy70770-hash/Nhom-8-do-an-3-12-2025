import React from 'react';
import UserProfile from '../../components/profile/UserProfile';
import './UserPages.css';

function ProfilePage() {
  return (
    <div className="profile-page-container">
      <div className="profile-page-wrapper">
        <UserProfile />
      </div>
    </div>
  );
}

export default ProfilePage;