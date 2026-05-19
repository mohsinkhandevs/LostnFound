import { useEffect } from 'react';
import './StaticPage.css';

const About = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="static-page">
            <div className="container container-sm">
                <div className="page-header">
                    <h1>About Lost & Found</h1>
                    <p className="page-subtitle">Connecting finders with owners, one item at a time</p>
                </div>

                <div className="page-content">
                    <section className="content-section">
                        <h2>Our Mission</h2>
                        <p>
                            Our University Lost & Found Portal is dedicated to reuniting lost items with their rightful owners within the
                            FAST National University community. We believe that losing personal belongings shouldn't
                            mean losing them forever.
                        </p>
                    </section>

                    <section className="content-section">
                        <h2>What We Do</h2>
                        <p>
                            Our platform provides a centralized, easy-to-use system where students, faculty, and
                            staff can:
                        </p>
                        <ul className="feature-list">
                            <li>Report lost items with detailed descriptions and photos</li>
                            <li>Report found items to help others recover their belongings</li>
                            <li>Search through reported items using smart filters</li>
                            <li>Receive automatic email notifications when potential matches are found</li>
                            <li>Connect directly with finders or owners to arrange returns</li>
                        </ul>
                    </section>

                    <section className="content-section">
                        <h2>Our Story</h2>
                        <p>
                            This Lost & Found Portal was created by students who experienced the frustration of losing valuable
                            items on campus. We recognized the need for a better system than traditional lost and
                            found boxes or social media posts that quickly get buried.
                        </p>
                        <p>
                            By leveraging modern technology and creating an intuitive platform, we've made it
                            easier than ever to report, search, and recover lost items within our university community.
                        </p>
                    </section>

                    <section className="content-section">
                        <h2>Our Values</h2>
                        <div className="values-grid">
                            <div className="value-card">
                                <div className="value-icon">🤝</div>
                                <h3>Community</h3>
                                <p>Building a culture of helping one another</p>
                            </div>
                            <div className="value-card">
                                <div className="value-icon">🔒</div>
                                <h3>Security</h3>
                                <p>Protecting user privacy and data</p>
                            </div>
                            <div className="value-card">
                                <div className="value-icon">⚡</div>
                                <h3>Efficiency</h3>
                                <p>Making recovery quick and simple</p>
                            </div>
                            <div className="value-card">
                                <div className="value-icon">💡</div>
                                <h3>Innovation</h3>
                                <p>Using technology to solve real problems</p>
                            </div>
                        </div>
                    </section>

                    <section className="content-section">
                        <h2>Join Our Community</h2>
                        <p>
                            Whether you've lost something precious or found an item that belongs to someone else,
                            our University Lost & Found Portal is here to help. Together, we can make our campus a place where lost items
                            find their way home.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default About;
