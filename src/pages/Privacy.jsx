import { useEffect } from 'react';
import './StaticPage.css';

const Privacy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="static-page">
            <div className="container container-sm">
                <div className="page-header">
                    <h1>Privacy Policy</h1>
                    <p className="page-subtitle">Last updated: November 23, 2025</p>
                </div>

                <div className="page-content">
                    <section className="content-section">
                        <h2>Introduction</h2>
                        <p>
                            Our University Lost & Found Portal ("we," "our," or "us") is committed to protecting your privacy. This Privacy
                            Policy explains how we collect, use, disclose, and safeguard your information when you
                            use our lost and found platform.
                        </p>
                    </section>

                    <section className="content-section">
                        <h2>Information We Collect</h2>

                        <h3>Personal Information</h3>
                        <p>When you register for an account, we collect:</p>
                        <ul className="feature-list">
                            <li>Full name</li>
                            <li>University email address</li>
                            <li>Phone number</li>
                            <li>Student/Faculty ID (optional)</li>
                            <li>Password (encrypted)</li>
                        </ul>

                        <h3>Item Information</h3>
                        <p>When you report lost or found items, we collect:</p>
                        <ul className="feature-list">
                            <li>Item descriptions and details</li>
                            <li>Photos of items</li>
                            <li>Location information</li>
                            <li>Date and time of loss/finding</li>
                        </ul>

                        <h3>Usage Information</h3>
                        <p>We automatically collect:</p>
                        <ul className="feature-list">
                            <li>Browser type and version</li>
                            <li>Device information</li>
                            <li>IP address</li>
                            <li>Pages visited and time spent</li>
                            <li>Search queries</li>
                        </ul>
                    </section>

                    <section className="content-section">
                        <h2>How We Use Your Information</h2>
                        <p>We use the collected information to:</p>
                        <ul className="feature-list">
                            <li>Create and manage your account</li>
                            <li>Process and display lost/found item reports</li>
                            <li>Match lost items with found items automatically</li>
                            <li>Send email notifications about matches</li>
                            <li>Facilitate communication between users</li>
                            <li>Improve our platform and user experience</li>
                            <li>Prevent fraud and ensure platform security</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </section>

                    <section className="content-section">
                        <h2>Information Sharing</h2>

                        <h3>With Other Users</h3>
                        <p>
                            When a match is found between a lost and found item, we share your contact information
                            (name, email, and phone number) with the matched party to facilitate item return.
                        </p>

                        <h3>With Third Parties</h3>
                        <p>We may share information with:</p>
                        <ul className="feature-list">
                            <li><strong>Email Service Providers:</strong> To send notifications and communications</li>
                            <li><strong>Cloud Storage Providers:</strong> To store photos and data securely</li>
                            <li><strong>Analytics Services:</strong> To understand platform usage (anonymized data)</li>
                            <li><strong>Legal Authorities:</strong> When required by law or to protect rights and safety</li>
                        </ul>

                        <h3>What We Don't Share</h3>
                        <p>
                            We never sell your personal information to third parties. Your data is only used for
                            the purposes outlined in this policy.
                        </p>
                    </section>

                    <section className="content-section">
                        <h2>Data Security</h2>
                        <p>We implement security measures including:</p>
                        <ul className="feature-list">
                            <li>Encrypted password storage</li>
                            <li>Secure HTTPS connections</li>
                            <li>Regular security audits</li>
                            <li>Access controls and authentication</li>
                            <li>Secure cloud storage for photos</li>
                        </ul>
                        <p>
                            However, no method of transmission over the internet is 100% secure. While we strive
                            to protect your information, we cannot guarantee absolute security.
                        </p>
                    </section>

                    <section className="content-section">
                        <h2>Your Rights</h2>
                        <p>You have the right to:</p>
                        <ul className="feature-list">
                            <li><strong>Access:</strong> Request a copy of your personal data</li>
                            <li><strong>Correction:</strong> Update or correct your information</li>
                            <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                            <li><strong>Opt-out:</strong> Unsubscribe from email notifications</li>
                            <li><strong>Data Portability:</strong> Request your data in a portable format</li>
                        </ul>
                        <p>
                            To exercise these rights, contact us at i243135@isb.nu.edu.pk
                        </p>
                    </section>

                    <section className="content-section">
                        <h2>Data Retention</h2>
                        <p>
                            We retain your personal information for as long as your account is active. Item reports
                            remain in the system until you delete them or mark them as resolved. After account
                            deletion, we may retain certain information for legal compliance and security purposes.
                        </p>
                    </section>

                    <section className="content-section">
                        <h2>Cookies and Tracking</h2>
                        <p>
                            We use cookies and similar technologies to maintain your session, remember your
                            preferences, and analyze platform usage. You can control cookies through your browser
                            settings, but some features may not function properly if cookies are disabled.
                        </p>
                    </section>

                    <section className="content-section">
                        <h2>Children's Privacy</h2>
                        <p>
                            The portal is intended for university students, faculty, and staff. We do not knowingly
                            collect information from individuals under 18 without parental consent.
                        </p>
                    </section>

                    <section className="content-section">
                        <h2>Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of significant
                            changes via email or through a notice on our platform. Continued use of the portal after
                            changes constitutes acceptance of the updated policy.
                        </p>
                    </section>

                    <section className="content-section">
                        <h2>Contact Us</h2>
                        <p>
                            If you have questions or concerns about this Privacy Policy, please contact us:
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

export default Privacy;
