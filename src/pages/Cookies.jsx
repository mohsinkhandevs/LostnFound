import { useEffect } from 'react';
import './StaticPage.css';

const Cookies = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="static-page">
            <div className="container container-sm">
                <div className="page-header">
                    <h1>Cookie Policy</h1>
                    <p className="page-subtitle">Last updated: November 23, 2025</p>
                </div>

                <div className="page-content">
                    <section className="content-section">
                        <h2>What Are Cookies?</h2>
                        <p>
                            Cookies are small text files that are placed on your device when you visit a website.
                            They help websites remember your preferences and improve your browsing experience.
                        </p>
                    </section>

                    <section className="content-section">
                        <h2>How We Use Cookies</h2>
                        <p>
                            Our University Lost & Found Portal uses cookies to:
                        </p>
                        <ul className="feature-list">
                            <li>Keep you logged in to your account</li>
                            <li>Remember your preferences and settings</li>
                            <li>Understand how you use our platform</li>
                            <li>Improve platform performance and functionality</li>
                            <li>Ensure security and prevent fraud</li>
                        </ul>
                    </section>

                    <section className="content-section">
                        <h2>Types of Cookies We Use</h2>

                        <h3>Essential Cookies</h3>
                        <p>
                            These cookies are necessary for the platform to function properly. They enable core
                            features like user authentication and session management.
                        </p>
                        <ul className="feature-list">
                            <li><strong>Authentication tokens:</strong> Keep you logged in</li>
                            <li><strong>Session cookies:</strong> Maintain your session state</li>
                            <li><strong>Security cookies:</strong> Protect against unauthorized access</li>
                        </ul>

                        <h3>Functional Cookies</h3>
                        <p>
                            These cookies remember your choices and preferences to provide a personalized experience.
                        </p>
                        <ul className="feature-list">
                            <li><strong>Preference cookies:</strong> Remember your settings</li>
                            <li><strong>Language cookies:</strong> Store your language preference</li>
                            <li><strong>UI cookies:</strong> Remember your interface preferences</li>
                        </ul>

                        <h3>Analytics Cookies</h3>
                        <p>
                            These cookies help us understand how visitors interact with our platform by collecting
                            anonymous information.
                        </p>
                        <ul className="feature-list">
                            <li><strong>Usage analytics:</strong> Track page views and user flows</li>
                            <li><strong>Performance metrics:</strong> Monitor platform speed and errors</li>
                            <li><strong>Feature analytics:</strong> Understand which features are most used</li>
                        </ul>
                    </section>

                    <section className="content-section">
                        <h2>Third-Party Cookies</h2>
                        <p>
                            We may use third-party services that set their own cookies:
                        </p>
                        <ul className="feature-list">
                            <li><strong>Cloudinary:</strong> For image hosting and optimization</li>
                            <li><strong>Email services:</strong> For sending notifications</li>
                            <li><strong>Analytics providers:</strong> For usage statistics (if applicable)</li>
                        </ul>
                        <p>
                            These third parties have their own privacy policies governing their use of cookies.
                        </p>
                    </section>

                    <section className="content-section">
                        <h2>Managing Cookies</h2>

                        <h3>Browser Settings</h3>
                        <p>
                            You can control and manage cookies through your browser settings. Most browsers allow you to:
                        </p>
                        <ul className="feature-list">
                            <li>View and delete cookies</li>
                            <li>Block all cookies</li>
                            <li>Block third-party cookies</li>
                            <li>Clear cookies when you close your browser</li>
                            <li>Set exceptions for specific websites</li>
                        </ul>

                        <h3>Impact of Disabling Cookies</h3>
                        <p>
                            Please note that if you disable cookies, some features of our portal may not function
                            properly:
                        </p>
                        <ul className="feature-list">
                            <li>You may not be able to stay logged in</li>
                            <li>Your preferences won't be saved</li>
                            <li>Some features may not work correctly</li>
                            <li>Your experience may be less personalized</li>
                        </ul>
                    </section>

                    <section className="content-section">
                        <h2>Cookie Duration</h2>

                        <h3>Session Cookies</h3>
                        <p>
                            These temporary cookies are deleted when you close your browser. They're used for
                            essential functions like maintaining your login session.
                        </p>

                        <h3>Persistent Cookies</h3>
                        <p>
                            These cookies remain on your device for a set period or until you delete them. We use
                            them to remember your preferences across sessions.
                        </p>
                    </section>

                    <section className="content-section">
                        <h2>Updates to This Policy</h2>
                        <p>
                            We may update this Cookie Policy from time to time to reflect changes in our practices
                            or for legal reasons. We'll notify you of significant changes through email or a notice
                            on our platform.
                        </p>
                    </section>

                    <section className="content-section">
                        <h2>Your Consent</h2>
                        <p>
                            By using our portal, you consent to our use of cookies as described in this policy.
                            If you don't agree with our use of cookies, you should adjust your browser settings
                            or discontinue use of the platform.
                        </p>
                    </section>

                    <section className="content-section">
                        <h2>More Information</h2>
                        <p>
                            For more details about how we protect your privacy, please read our
                            <a href="/privacy" style={{ color: 'var(--primary-500)', marginLeft: '4px' }}>Privacy Policy</a>.
                        </p>
                    </section>

                    <section className="content-section contact-section">
                        <h2>Contact Us</h2>
                        <p>
                            If you have questions about our use of cookies, please contact us:
                        </p>
                        <div className="contact-info-box">
                            <div className="contact-detail">
                                <strong>Email:</strong> i243135@isb.nu.edu.pk
                            </div>
                            <div className="contact-detail">
                                <strong>Phone:</strong> 0300-0920513
                            </div>
                            <div className="contact-detail">
                                <strong>Hours:</strong> Monday - Friday, 9:00 AM - 5:00 PM
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Cookies;
