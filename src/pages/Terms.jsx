import { useEffect } from 'react';
import './StaticPage.css';

const Terms = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="static-page">
            <div className="container container-sm">
                <div className="page-header">
                    <h1>Terms of Service</h1>
                    <p className="page-subtitle">Last updated: November 23, 2025</p>
                </div>

                <div className="page-content">
                    <section className="content-section">
                        <h2>Agreement to Terms</h2>
                        <p>
                            By accessing and using this University Lost & Found Portal, you agree to be bound by these Terms of Service
                            and all applicable laws and regulations. If you do not agree with any of these terms,
                            you are prohibited from using this platform.
                        </p>
                    </section>

                    <section className="content-section">
                        <h2>Eligibility</h2>
                        <p>
                            This Lost & Found Portal is exclusively available to:
                        </p>
                        <ul className="feature-list">
                            <li>Current students of FAST National University</li>
                            <li>Faculty members of FAST National University</li>
                            <li>Staff members of FAST National University</li>
                        </ul>
                        <p>
                            You must have a valid university email address (@isb.nu.edu.pk or @nu.edu.pk) to
                            register and use the platform.
                        </p>
                    </section>

                    <section className="content-section">
                        <h2>User Accounts</h2>

                        <h3>Account Creation</h3>
                        <p>
                            You must provide accurate, current, and complete information during registration.
                            You are responsible for maintaining the confidentiality of your account credentials.
                        </p>

                        <h3>Account Security</h3>
                        <ul className="feature-list">
                            <li>You are responsible for all activities under your account</li>
                            <li>Notify us immediately of any unauthorized access</li>
                            <li>Do not share your password with others</li>
                            <li>Use a strong, unique password</li>
                        </ul>

                        <h3>Account Termination</h3>
                        <p>
                            We reserve the right to suspend or terminate accounts that violate these terms or
                            engage in fraudulent, abusive, or illegal activities.
                        </p>
                    </section>

                    <section className="content-section">
                        <h2>Acceptable Use</h2>

                        <h3>You May:</h3>
                        <ul className="feature-list">
                            <li>Report genuinely lost or found items</li>
                            <li>Search for your lost belongings</li>
                            <li>Contact matched users to arrange item returns</li>
                            <li>Update or delete your own reports</li>
                        </ul>

                        <h3>You May Not:</h3>
                        <ul className="feature-list">
                            <li>Post false, misleading, or fraudulent reports</li>
                            <li>Use the platform for commercial purposes or advertising</li>
                            <li>Harass, threaten, or abuse other users</li>
                            <li>Attempt to gain unauthorized access to the system</li>
                            <li>Upload malicious code or viruses</li>
                            <li>Scrape or collect data without permission</li>
                            <li>Impersonate others or create fake accounts</li>
                            <li>Post inappropriate, offensive, or illegal content</li>
                        </ul>
                    </section>

                    <section className="content-section">
                        <h2>Content Guidelines</h2>

                        <h3>Item Reports</h3>
                        <p>When reporting items, you must:</p>
                        <ul className="feature-list">
                            <li>Provide accurate and truthful information</li>
                            <li>Upload appropriate photos (no offensive content)</li>
                            <li>Include relevant details to help identification</li>
                            <li>Update reports when items are recovered</li>
                        </ul>

                        <h3>Prohibited Content</h3>
                        <p>Do not post content that is:</p>
                        <ul className="feature-list">
                            <li>Illegal, fraudulent, or deceptive</li>
                            <li>Offensive, hateful, or discriminatory</li>
                            <li>Sexually explicit or inappropriate</li>
                            <li>Violates intellectual property rights</li>
                            <li>Contains personal information of others without consent</li>
                        </ul>
                    </section>

                    <section className="content-section">
                        <h2>Intellectual Property</h2>

                        <h3>Your Content</h3>
                        <p>
                            You retain ownership of photos and content you upload. By posting on the portal, you
                            grant us a license to use, display, and distribute your content for platform operations.
                        </p>

                        <h3>Our Content</h3>
                        <p>
                            The Lost & Found Portal, including its design, code, logos, and features, is protected
                            by copyright and other intellectual property laws. You may not copy, modify, or
                            distribute our content without permission.
                        </p>
                    </section>

                    <section className="content-section">
                        <h2>Disclaimer of Warranties</h2>
                        <p>
                            The portal is provided "as is" and "as available" without warranties of any kind. We do not:
                        </p>
                        <ul className="feature-list">
                            <li>Guarantee that items will be recovered</li>
                            <li>Verify the accuracy of user-submitted information</li>
                            <li>Take responsibility for interactions between users</li>
                            <li>Warrant uninterrupted or error-free service</li>
                            <li>Guarantee the security of data transmission</li>
                        </ul>
                    </section>

                    <section className="content-section">
                        <h2>Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by law, this platform and its operators shall not be
                            liable for:
                        </p>
                        <ul className="feature-list">
                            <li>Loss or theft of items</li>
                            <li>Disputes between users</li>
                            <li>Damages arising from platform use</li>
                            <li>Data loss or security breaches</li>
                            <li>Third-party actions or content</li>
                        </ul>
                    </section>

                    <section className="content-section">
                        <h2>User Responsibilities</h2>
                        <p>When arranging item returns, you should:</p>
                        <ul className="feature-list">
                            <li>Meet in safe, public locations on campus</li>
                            <li>Verify item ownership before returning</li>
                            <li>Report suspicious or fraudulent activity</li>
                            <li>Use common sense and caution</li>
                            <li>Respect university property and rules</li>
                        </ul>
                    </section>

                    <section className="content-section">
                        <h2>Privacy</h2>
                        <p>
                            Your use of the portal is also governed by our Privacy Policy. Please review it to
                            understand how we collect, use, and protect your information.
                        </p>
                    </section>

                    <section className="content-section">
                        <h2>Modifications to Service</h2>
                        <p>
                            We reserve the right to:
                        </p>
                        <ul className="feature-list">
                            <li>Modify or discontinue features at any time</li>
                            <li>Update these Terms of Service</li>
                            <li>Change platform policies and procedures</li>
                            <li>Implement new features or restrictions</li>
                        </ul>
                        <p>
                            Significant changes will be communicated via email or platform notifications.
                        </p>
                    </section>

                    <section className="content-section">
                        <h2>Governing Law</h2>
                        <p>
                            These Terms of Service are governed by the laws of Pakistan. Any disputes shall be
                            resolved in accordance with Pakistani law and within the jurisdiction of Islamabad courts.
                        </p>
                    </section>

                    <section className="content-section">
                        <h2>Contact Information</h2>
                        <p>
                            For questions about these Terms of Service, please contact us:
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

                    <section className="content-section">
                        <h2>Acceptance of Terms</h2>
                        <p>
                            By using the portal, you acknowledge that you have read, understood, and agree to be
                            bound by these Terms of Service. If you do not agree, please discontinue use of the platform.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Terms;
