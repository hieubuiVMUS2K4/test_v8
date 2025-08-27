import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AuthenticationPage.module.css';
import { useAuth } from '../hooks/useAuth';

const AuthenticationPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        rememberMe: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const navigate = useNavigate();
    const { login } = useAuth();

    // Check if user is already logged in
    const { user, isAuthenticated } = useAuth();
    
    React.useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'ADMIN' || user.type === 'admin') {
                navigate('/admin');
            } else if (user.role === 'STUDENT' || user.type === 'student') {
                navigate('/student/subjects');
            }
        }
    }, [isAuthenticated, user, navigate]);


    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // Clear messages when user types
        setError('');
        setSuccess('');
    };

    // Đơn giản hóa fillDemo
    const fillDemo = (type) => {
        if (type === 'STUDENT') {
            setFormData({
                username: 'student',
                password: '123456',
                rememberMe: false
            });
        } else if (type === 'ADMIN') {
            setFormData({
                username: 'admin1', 
                password: '123456',
                rememberMe: false
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.username || !formData.password) {
            setError('Vui lòng nhập đầy đủ thông tin!');
            return;
        }
        
        setLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const data = await login(formData.username, formData.password);
            
            if (formData.rememberMe) {
                localStorage.setItem('rememberLogin', 'true');
            }
            
            setSuccess('Đăng nhập thành công! Đang chuyển hướng...');
            
            // Navigate based on user role
            setTimeout(() => {
                if (data.user.role === 'ADMIN' || data.user.type === 'admin') {
                    navigate('/admin');
                } else if (data.user.role === 'STUDENT' || data.user.type === 'student') {
                    navigate('/student/subjects');
                } else {
                    navigate('/');
                }
            }, 1000);
            
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Tài khoản hoặc mật khẩu không đúng!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginPage}>
            <div className={styles.background}>
                <div className={styles.wave}></div>
                <div className={styles.wave}></div>
            </div>
            
            <div className={styles.loginContainer}>
                <div className={styles.header}>
                    <div className={styles.logoContainer}>
                        <div className={styles.icon}>⚓</div>
                        <div className={styles.logoRing}></div>
                    </div>
                    <h1 className={styles.title}>Hệ thống Trắc nghiệm</h1>
                    <p className={styles.subtitle}>Tuần Sinh hoạt Công dân - Sinh viên Hàng Hải</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && (
                        <div className={styles.error}>
                            <i className="fas fa-exclamation-triangle"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className={styles.successMessage}>
                            <i className="fas fa-check-circle"></i>
                            <span>{success}</span>
                        </div>
                    )}

                    <div className={styles.inputGroup}>
                        <label htmlFor="username">Mã sinh viên / Tài khoản</label>
                        <div className={styles.inputWrapper}>
                            <i className="fas fa-user"></i>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                placeholder="Nhập mã sinh viên hoặc tài khoản"
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Mật khẩu</label>
                        <div className={styles.inputWrapper}>
                            <i className="fas fa-lock"></i>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Nhập mật khẩu"
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.options}>
                        <label className={styles.checkbox}>
                            <input
                                type="checkbox"
                                name="rememberMe"
                                checked={formData.rememberMe}
                                onChange={handleInputChange}
                            />
                            <span className={styles.checkmark}></span>
                            <span>Ghi nhớ đăng nhập</span>
                        </label>
                        <button 
                            type="button"
                            className={styles.forgotPassword}
                            onClick={() => alert('Chức năng quên mật khẩu đang phát triển.')}
                        >
                            Quên mật khẩu?
                        </button>
                    </div>

                    <button type="submit" className={styles.loginButton} disabled={loading}>
                        {loading ? (
                            <>
                                <div className={styles.spinner}></div>
                                Đang đăng nhập...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-sign-in-alt"></i>
                                Đăng nhập
                            </>
                        )}
                    </button>
                </form>

                <div className={styles.divider}>
                    <span>hoặc</span>
                </div>

                <div className={styles.demo}>
                    <p>Tài khoản demo:</p>
                    <div className={styles.demoAccounts}>
                        <button type="button" className={styles.demoBtn} onClick={() => fillDemo('student')}>
                            <i className="fas fa-graduation-cap"></i>
                            Sinh viên
                        </button>
                        <button type="button" className={styles.demoBtn} onClick={() => fillDemo('admin')}>
                            <i className="fas fa-user-shield"></i>
                            Admin
                        </button>
                    </div>
                </div>

                <div className={styles.footer}>
                    <p>© 2024 Trường Đại học Hàng hải Việt Nam</p>
                </div>
            </div>
        </div>
    );
};

export default AuthenticationPage;