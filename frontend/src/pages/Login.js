import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState(''); // kullanıcı adı
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await login(username, password);
      if (result?.token) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user || {}));
        navigate('/dashboard', { replace: true });
      } else {
        setError(result?.message || 'Giriş başarısız.');
      }
    } catch (err) {
      setError(err?.message || 'Bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        background:
          'linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #8b5cf6 100%)'
      }}
    >
      <div className="container px-3">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <div
                    className="rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                    style={{
                      width: 56,
                      height: 56,
                      background:
                        'linear-gradient(135deg, #3b82f6, #22c55e 70%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 22
                    }}
                  >
                    F
                  </div>
                  <h1 className="h4 mb-0">Flow ERP</h1>
                  <p className="text-secondary mb-0">Hesabınıza giriş yapın</p>
                </div>

                {error ? <div className="alert alert-danger">{error}</div> : null}

                <form onSubmit={handleSubmit} noValidate>
                  <div className="form-floating mb-3">
                    <input
                      id="username"
                      type="text"
                      className="form-control"
                      placeholder="Kullanıcı adı"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                    <label htmlFor="username">Kullanıcı Adı</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      id="password"
                      type="password"
                      className="form-control"
                      placeholder="Şifre"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <label htmlFor="password">Şifre</label>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Giriş yapılıyor...
                      </>
                    ) : (
                      'Giriş Yap'
                    )}
                  </button>
                </form>

                <div className="d-flex justify-content-between mt-3">
                  <a className="link-secondary small" href="#!"
                    onClick={(e) => e.preventDefault()}>
                    Şifremi unuttum
                  </a>
                  <a className="link-secondary small" href="#!"
                    onClick={(e) => e.preventDefault()}>
                    Yardım
                  </a>
                </div>
              </div>
            </div>

            <p className="text-center text-white-50 mt-3 small">
              © {new Date().getFullYear()} Flow ERP
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}