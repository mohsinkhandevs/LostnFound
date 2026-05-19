import { useEffect } from 'react';
import './StaticPage.css';

const HowItWorks = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="static-page">
            <div className="container container-sm">
                <div className="page-header">
                    <h1>How It Works</h1>
                    <p className="page-subtitle">A simple guide to using our University Lost & Found Portal</p>
                </div>

                <div className="page-content">
                    <section className="content-section">
                        <h2>📱 Getting Started</h2>
                        <div className="steps-container">
                            <div className="step">
                                <div className="step-number">1</div>
                                <div className="step-content">
                                    <h3>Create an Account</h3>
                                    <p>
                                        Sign up using your university email address (@isb.nu.edu.pk or @nu.edu.pk).
                                        You'll receive an OTP for verification to ensure security.
                                    </p>
                                </div>
                            </div>

                            <div className="step">
                                <div className="step-number">2</div>
                                <div className="step-content">
                                    <h3>Verify Your Email</h3>
                                    <p>
                                        Enter the OTP sent to your email to activate your account. This ensures
                                        only university members can access the platform.
                                    </p>
                                </div>
                            </div>

                            <div className="step">
                                <div className="step-number">3</div>
                                <div className="step-content">
                                    <h3>Complete Your Profile</h3>
                                    <p>
                                        Add your contact information so others can reach you when items are matched.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="content-section">
                        <h2>😢 If You Lost Something</h2>
                        <div className="steps-container">
                            <div className="step">
                                <div className="step-number">1</div>
                                <div className="step-content">
                                    <h3>Report Your Lost Item</h3>
                                    <p>
                                        Click "Report Lost" and fill in details: item name, category, description,
                                        location where lost, and upload photos if available.
                                    </p>
                                </div>
                            </div>

                            <div className="step">
                                <div className="step-number">2</div>
                                <div className="step-content">
                                    <h3>Auto-Matching System</h3>
                                    <p>
                                        Our smart system automatically checks if anyone has reported finding a
                                        similar item. You'll receive an email notification if there's a match!
                                    </p>
                                </div>
                            </div>

                            <div className="step">
                                <div className="step-number">3</div>
                                <div className="step-content">
                                    <h3>Connect & Recover</h3>
                                    <p>
                                        Contact the finder through the provided information and arrange to
                                        retrieve your item safely.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="content-section">
                        <h2>🎉 If You Found Something</h2>
                        <div className="steps-container">
                            <div className="step">
                                <div className="step-number">1</div>
                                <div className="step-content">
                                    <h3>Report the Found Item</h3>
                                    <p>
                                        Click "Report Found" and provide details about the item, where you found
                                        it, and upload clear photos to help identify it.
                                    </p>
                                </div>
                            </div>

                            <div className="step">
                                <div className="step-number">2</div>
                                <div className="step-content">
                                    <h3>Get Notified of Matches</h3>
                                    <p>
                                        If someone has reported losing a similar item, both parties receive email
                                        notifications automatically.
                                    </p>
                                </div>
                            </div>

                            <div className="step">
                                <div className="step-number">3</div>
                                <div className="step-content">
                                    <h3>Help Return the Item</h3>
                                    <p>
                                        Coordinate with the owner to return their item. You'll be making someone's day!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="content-section">
                        <h2>🔍 Searching for Items</h2>
                        <p>
                            Browse all reported items on the "Reported Items" page. Use filters to narrow down
                            your search by:
                        </p>
                        <ul className="feature-list">
                            <li><strong>Category:</strong> Electronics, Documents, Accessories, Clothing, etc.</li>
                            <li><strong>Status:</strong> Lost or Found items</li>
                            <li><strong>Location:</strong> Where the item was lost or found</li>
                            <li><strong>Date:</strong> When it was reported</li>
                        </ul>
                    </section>

                    <section className="content-section">
                        <h2>💡 Tips for Success</h2>
                        <div className="tips-grid">
                            <div className="tip-card">
                                <h4>Be Detailed</h4>
                                <p>Include specific details like brand, color, unique features, and serial numbers</p>
                            </div>
                            <div className="tip-card">
                                <h4>Add Photos</h4>
                                <p>Clear photos greatly increase the chances of matching and recovery</p>
                            </div>
                            <div className="tip-card">
                                <h4>Act Quickly</h4>
                                <p>Report lost or found items as soon as possible for better results</p>
                            </div>
                            <div className="tip-card">
                                <h4>Check Regularly</h4>
                                <p>Keep an eye on new reports in case your item appears</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default HowItWorks;
