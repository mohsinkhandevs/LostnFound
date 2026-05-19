import { useEffect, useState } from 'react';
import './StaticPage.css';

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const faqs = [
        {
            question: "Who can use the Lost & Found Portal?",
            answer: "The University Lost & Found Portal is exclusively for FAST National University students, faculty, and staff. You need a valid university email address (@isb.nu.edu.pk or @nu.edu.pk) to register."
        },
        {
            question: "How do I report a lost item?",
            answer: "After logging in, click on 'Report Lost' in the navigation menu. Fill in the details about your lost item including name, category, description, location where lost, and upload photos if available. Our system will automatically check for matches with found items."
        },
        {
            question: "What happens when I report a found item?",
            answer: "When you report a found item, our system automatically searches for matching lost item reports. If a potential match is found, both you and the person who lost the item will receive email notifications with contact information to arrange the return."
        },
        {
            question: "How does the auto-matching system work?",
            answer: "Our intelligent matching system compares item details like category, name, description, and location. When a lost item report matches a found item report (or vice versa), both parties are automatically notified via email."
        },
        {
            question: "Will I be notified if someone finds my item?",
            answer: "Yes! You'll receive an email notification if someone reports finding an item that matches your lost item description. The email will include the finder's contact information."
        },
        {
            question: "How long do reports stay active?",
            answer: "Reports remain active until you mark them as resolved or delete them. We recommend updating or deleting your report once you've recovered your item to keep the database current."
        },
        {
            question: "Can I edit my report after submitting it?",
            answer: "Yes! Go to 'My Items' to view all your reports. You can edit the details or delete reports at any time."
        },
        {
            question: "What should I include in my item description?",
            answer: "Be as detailed as possible! Include brand names, colors, unique features, serial numbers, and any distinguishing marks. The more specific you are, the better the chances of a successful match."
        },
        {
            question: "Should I upload photos?",
            answer: "Absolutely! Photos greatly increase the chances of successful identification and matching. Upload clear, well-lit photos showing distinctive features of the item."
        },
        {
            question: "Is my personal information safe?",
            answer: "Yes. We only share your contact information with matched parties (when a lost and found item match). Your email and phone number are never publicly displayed. See our Privacy Policy for more details."
        },
        {
            question: "What if I find an item but don't know who lost it?",
            answer: "Simply report it as a found item with as much detail as possible. Our system will automatically notify anyone who has reported losing a similar item."
        },
        {
            question: "Can I search for my lost item?",
            answer: "Yes! Visit the 'Reported Items' page to browse all lost and found items. Use filters to narrow down your search by category, location, and date."
        },
        {
            question: "What should I do after being matched with someone?",
            answer: "Contact them using the provided information (email or phone) to verify the item details and arrange a safe meeting place on campus to return/retrieve the item."
        },
        {
            question: "I forgot my password. What should I do?",
            answer: "Click 'Forgot Password' on the login page. Enter your registered email address, and we'll send you instructions to reset your password."
        },
        {
            question: "Can I report items lost outside the university?",
            answer: "The portal is specifically designed for items lost or found on FAST National University campus. For items lost elsewhere, please contact local authorities or use other lost and found services."
        },
        {
            question: "How do I contact support?",
            answer: "You can reach us at i243135@isb.nu.edu.pk or call 0300-0920513. Our support hours are Monday to Friday, 9:00 AM to 5:00 PM."
        }
    ];

    return (
        <div className="static-page">
            <div className="container container-sm">
                <div className="page-header">
                    <h1>Frequently Asked Questions</h1>
                    <p className="page-subtitle">Find answers to common questions about our portal</p>
                </div>

                <div className="page-content">
                    <div className="faq-container">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className={`faq-item ${openIndex === index ? 'active' : ''}`}
                            >
                                <button
                                    className="faq-question"
                                    onClick={() => toggleFAQ(index)}
                                >
                                    <span>{faq.question}</span>
                                    <svg
                                        className="faq-icon"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                                <div className="faq-answer">
                                    <p>{faq.answer}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <section className="content-section contact-section">
                        <h2>Still Have Questions?</h2>
                        <p>
                            If you couldn't find the answer you're looking for, feel free to contact us:
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

export default FAQ;
