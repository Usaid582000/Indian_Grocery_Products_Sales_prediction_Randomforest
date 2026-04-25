import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function AccountPage() {
  const { user, updateUserProfile, updateUserEmail, updateUserPassword } = useAuth();
  const router = useRouter();
  const { action } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    phone: '',
    gender: 'Other'
  });

  const [passwords, setPasswords] = useState({
    newPass: '',
    confirmPass: ''
  });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        const data = docSnap.exists() ? docSnap.data() : {};
        setFormData({
          displayName: user.displayName || '',
          username: data.username || '',
          email: user.email || '',
          phone: data.phone || '',
          gender: data.gender || 'Other'
        });
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUserData();
  }, [user]);

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      // Update Email if changed
      if (formData.email !== user.email) {
        await updateUserEmail(formData.email);
      }

      // Update Firestore + Auth Display Name
      await updateUserProfile({
        displayName: formData.displayName,
        username: formData.username,
        phone: formData.phone,
        gender: formData.gender,
        email: formData.email
      });

      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (passwords.newPass !== passwords.confirmPass) {
      return setError('Passwords do not match.');
    }
    if (passwords.newPass.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setSaving(true);
    try {
      await updateUserPassword(passwords.newPass);
      setSuccess('Password updated successfully!');
      setPasswords({ newPass: '', confirmPass: '' });
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setError('For security, please log out and log back in to change your password.');
      } else {
        setError(err.message || 'Failed to update password.');
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Layout title="Account"><div className="loading">Loading...</div></Layout>;

  return (
    <Layout title="Account Settings">
      <div id="account-page-override">
        <div className="account-hero">
          <button className="back-btn" onClick={() => router.back()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <h1>{action === 'password' ? 'Security' : 'Personal Info'}</h1>
        </div>

        <div className="account-container">
          {error && <div className="status-msg error">{error}</div>}
          {success && <div className="status-msg success">{success}</div>}

          {action !== 'password' ? (
            <form className="account-form m-card" onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="e.g. Alex Johnson"
                />
              </div>

              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. alex_user77"
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Gender</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <button className="save-btn" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          ) : (
            <form className="account-form m-card" onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>New Password</label>
                <div className="input-with-icon">
                  <input
                    type={showPass ? "text" : "password"}
                    value={passwords.newPass}
                    onChange={e => setPasswords({ ...passwords, newPass: e.target.value })}
                    placeholder="At least 6 characters"
                  />
                  <button type="button" className="icon-btn" onClick={() => setShowPass(!showPass)}>
                    {showPass ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwords.confirmPass}
                  onChange={e => setPasswords({ ...passwords, confirmPass: e.target.value })}
                />
              </div>
              <button className="save-btn" type="submit" disabled={saving}>
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

          {action === 'password' && (
            <button className="text-link" onClick={() => router.push('/account')}>
              Back to Personal Info
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        #account-page-override {
          min-height: 100vh; background: #f7f5fa; font-family: 'Outfit', sans-serif;
          padding-bottom: 120px;
        }
        .account-hero {
          background: linear-gradient(135deg, #1f1d3c 0%, #28254c 100%);
          padding: 60px 24px 40px; color: white; display: flex; align-items: center; gap: 20px;
        }
        .back-btn {
          background: rgba(255,255,255,0.1); border: none; width: 44px; height: 44px;
          border-radius: 12px; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;
        }
        .account-hero h1 { font-size: 28px; font-weight: 800; margin: 0; color: white !important; }
        
        .account-container { padding: 0 20px; margin-top: -20px; max-width: 600px; margin-left: auto; margin-right: auto; }
        
        .m-card { background: white; border-radius: 32px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); }
        
        .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .form-row { display: flex; gap: 16px; }
        .flex-1 { flex: 1; }
        label { font-size: 13px; font-weight: 700; color: #64748b; padding-left: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
        input, select {
          height: 56px; border-radius: 18px; border: 1.5px solid #f1f5f9; background: #f8fafc;
          padding: 0 16px; font-size: 15px; font-weight: 600; color: #1e1b4b; outline: none; transition: all 0.2s;
        }
        input:focus, select:focus { border-color: #6366f1; background: white; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
        
        .save-btn {
          width: 100%; height: 60px; background: #1e1b4b; color: white; border: none; border-radius: 20px;
          font-size: 16px; font-weight: 800; cursor: pointer; margin-top: 10px; transition: all 0.2s;
        }
        .save-btn:active { transform: scale(0.98); }
        .save-btn:disabled { opacity: 0.5; }
        
        .status-msg { padding: 16px; border-radius: 16px; margin-bottom: 20px; font-size: 14px; font-weight: 600; text-align: center; }
        .error { background: #fff1f2; color: #e11d48; }
        .success { background: #f0fdf4; color: #16a34a; }
        
        .input-with-icon { position: relative; display: flex; align-items: center; }
        .input-with-icon input { width: 100%; padding-right: 50px; }
        .icon-btn {
          position: absolute; right: 12px; background: none; border: none;
          font-size: 20px; cursor: pointer; padding: 8px; opacity: 0.6;
          transition: opacity 0.2s;
        }
        .icon-btn:hover { opacity: 1; }

        .text-link {
          display: block; width: 100%; background: none; border: none; color: #6366f1;
          font-weight: 700; font-size: 14px; margin-top: 24px; cursor: pointer;
        }

        .loading { padding: 100px; text-align: center; font-weight: 600; color: #94a3b8; }
      `}</style>
    </Layout>
  );
}
