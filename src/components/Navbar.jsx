import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import './Navbar.css';

const Navbar = () => {
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [allItems, setAllItems] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
    const [matches, setMatches] = useState([]);

    // Fetch search catalog and matches dynamically on mount or auth change
    useEffect(() => {
        if (isAuthenticated) {
            fetchSearchCatalog();
            fetchMatches();
        }
    }, [isAuthenticated]);

    // Handle clicking outside to close instant search
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setSearchDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSearchCatalog = async () => {
        try {
            const [lostRes, foundRes] = await Promise.all([
                api.get('/items/lost'),
                api.get('/items/found')
            ]);
            const lost = lostRes.data.map(x => ({ ...x, type: 'lost' }));
            const found = foundRes.data.map(x => ({ ...x, type: 'found' }));
            setAllItems([...lost, ...found]);
        } catch (error) {
            console.error('Navbar pre-fetch catalog failed:', error);
        }
    };

    const fetchMatches = async () => {
        try {
            const res = await api.get('/items/matches');
            setMatches(res.data);
        } catch (error) {
            console.error('Navbar fetch matches failed:', error);
        }
    };

    // Filter results locally for instantaneous preview feedback
    useEffect(() => {
        if (searchValue.trim().length > 0 && allItems.length > 0) {
            const query = searchValue.toLowerCase();
            const matches = allItems.filter(item => 
                item.item_name.toLowerCase().includes(query) ||
                item.category.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query)
            );
            setSearchResults(matches.slice(0, 3)); // Limit preview to top 3
            setSearchDropdownOpen(true);
        } else {
            setSearchResults([]);
            setSearchDropdownOpen(false);
        }
    }, [searchValue, allItems]);

    const handleLogout = () => {
        logout();
        navigate('/');
        setMobileMenuOpen(false);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchValue.trim()) {
            navigate(`/reportedItems?keyword=${encodeURIComponent(searchValue.trim())}`);
            setSearchValue('');
            setSearchDropdownOpen(false);
        }
    };

    return (
        <nav className="navbar glassmorphism">
            <div className="container">
                <div className="navbar-content">
                    {/* Brand Insignia Logo - Strict Branding Policy */}
                    <Link to="/" className="navbar-logo">
                        <svg className="logo-shield" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            <path d="m9 12 2 2 4-4"/>
                        </svg>
                        <span className="logo-text">Lost & Found Portal</span>
                    </Link>

                    {/* Integrated Central Search Bar & Instant Drops Panel */}
                    <div className="navbar-search-container" ref={dropdownRef}>
                        <form onSubmit={handleSearchSubmit} className="navbar-search-form">
                            <div className="navbar-search-wrapper">
                                <svg className="navbar-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"/>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                </svg>
                                <input
                                    type="text"
                                    className="navbar-search-input"
                                    placeholder="Instant item lookup..."
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    onFocus={() => {
                                        if (searchValue.trim().length > 0) setSearchDropdownOpen(true);
                                    }}
                                />
                            </div>
                        </form>

                        {/* Instant Search Dropdown Panel */}
                        {searchDropdownOpen && searchResults.length > 0 && (
                            <div className="navbar-instant-dropdown glassmorphism animate-fade-in">
                                <div className="instant-dropdown-header">Top Catalog Matches</div>
                                {searchResults.map((item) => {
                                    const imageUrl = item.image_path?.startsWith('http')
                                        ? item.image_path
                                        : item.image_path
                                            ? `/uploads/${item.image_path}`
                                            : null;

                                    return (
                                        <Link
                                            key={`${item.type}-${item.id}`}
                                            to={`/items/${item.type}/${item.id}`}
                                            className="instant-dropdown-item"
                                            onClick={() => {
                                                setSearchDropdownOpen(false);
                                                setSearchValue('');
                                            }}
                                        >
                                            {imageUrl ? (
                                                <img src={imageUrl} alt={item.item_name} className="instant-item-thumb" />
                                            ) : (
                                                <div className="instant-item-thumb-fallback">📦</div>
                                            )}
                                            <div className="instant-item-info">
                                                <span className="instant-item-name">{item.item_name}</span>
                                                <span className="instant-item-cat">{item.category} • {item.type}</span>
                                            </div>
                                        </Link>
                                    );
                                })}
                                <Link
                                    to={`/reportedItems?keyword=${encodeURIComponent(searchValue.trim())}`}
                                    className="instant-dropdown-footer"
                                    onClick={() => {
                                        setSearchDropdownOpen(false);
                                        setSearchValue('');
                                    }}
                                >
                                    Browse all matching records →
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Desktop Navigation Links */}
                    <div className="navbar-links">
                        <NavLink to="/" className="nav-link">Home</NavLink>
                        <NavLink to="/reportedItems" className="nav-link">All Items</NavLink>

                        {isAuthenticated ? (
                            <>
                                <NavLink to="/report-lost" className="nav-link">Report Lost</NavLink>
                                <NavLink to="/report-found" className="nav-link">Report Found</NavLink>
                                <NavLink to="/my-items" className="nav-link">My Reports</NavLink>
                                {isAdmin && <NavLink to="/admin" className="nav-link admin-link">Admin</NavLink>}
                                
                                {/* Match Notification Bell (Jiggles when matches present) */}
                                <div className="nav-notifications">
                                    <button className="bell-button" aria-label="Matches notifications">
                                        <svg 
                                            className={matches.length > 0 ? "bell-ring-active" : ""} 
                                            width="20" height="20" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                        >
                                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                                        </svg>
                                        {matches.length > 0 && (
                                            <span className="bell-badge">{matches.length}</span>
                                        )}
                                    </button>
                                    <div className="notifications-dropdown">
                                        <div className="notifications-header">Match Center Alerts</div>
                                        {matches.length > 0 ? (
                                            matches.map(match => {
                                                const lostName = match.lost_item_id?.item_name || 'Item';
                                                const foundName = match.found_item_id?.item_name || 'Item';
                                                const isLostOwner = match.lost_item_id?.user_id?._id === user?.id || match.lost_item_id?.user_id === user?.id;
                                                const title = isLostOwner 
                                                    ? `Potential found match: "${foundName}"` 
                                                    : `Potential claim match: "${lostName}"`;

                                                return (
                                                    <Link key={match._id} to="/my-items" className="notification-item animate-fade-in">
                                                        <span className="notification-icon">🔍</span>
                                                        <div className="notification-body">
                                                            <span className="notification-title">{title}</span>
                                                            <span className="notification-time">Match score: {match.score}%</span>
                                                        </div>
                                                    </Link>
                                                );
                                            })
                                        ) : (
                                            <div className="notification-item-empty" style={{ padding: 'var(--spacing-md)', textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                                                No active matches at this time.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* User profile navigation dropdown */}
                                <div className="nav-user-menu">
                                    <button className="user-button">
                                        <div className="user-avatar">{user?.fullName?.charAt(0) || 'U'}</div>
                                        <span>{user?.fullName?.split(' ')[0]}</span>
                                    </button>
                                    <div className="user-dropdown">
                                        <Link to="/profile" className="dropdown-item">Account Profile</Link>
                                        <button onClick={handleLogout} className="dropdown-item">Logout Session</button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
                                <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu trigger */}
                    <button
                        className="mobile-menu-button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle Menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="mobile-menu glassmorphism">
                        <Link to="/" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                            Home Dashboard
                        </Link>
                        <Link to="/reportedItems" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                            All Reported Items
                        </Link>

                        {isAuthenticated ? (
                            <>
                                <Link to="/report-lost" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                                    Report Lost Item
                                </Link>
                                <Link to="/report-found" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                                    Report Found Item
                                </Link>
                                <Link to="/my-items" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                                    My Items Dashboard
                                </Link>
                                {isAdmin && (
                                    <Link to="/admin" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                                        Admin Panel
                                    </Link>
                                )}
                                <Link to="/profile" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                                    Account Profile
                                </Link>
                                <button onClick={handleLogout} className="mobile-link">
                                    Logout Session
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                                    Sign In
                                </Link>
                                <Link to="/register" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                                    Create Account
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
