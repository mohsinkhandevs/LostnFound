import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../utils/api';
import ItemCard from '../components/ItemCard';
import Toast, { useToast } from '../components/Toast';
import './Search.css';

const Search = () => {
    const location = useLocation();
    const { toasts, showToast } = useToast();

    // UI View states
    const [activeType, setActiveType] = useState('all'); // 'all', 'lost', 'found'
    const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'
    const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
    const [visibleCount, setVisibleCount] = useState(8);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        keyword: '',
        category: '',
        location: '',
        dateFrom: '',
        dateTo: '',
        sort: 'newest'
    });

    // Right Drawer state variables
    const [selectedItem, setSelectedItem] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const openQuickView = (item, type) => {
        setSelectedItem({ ...item, type });
        setIsDrawerOpen(true);
    };

    const closeQuickView = () => {
        setIsDrawerOpen(false);
        setSelectedItem(null);
    };

    // ESC key listener keyboard guardrail
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeQuickView();
            }
        };
        if (isDrawerOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isDrawerOpen]);

    // Background scroll lock guardrail
    useEffect(() => {
        if (isDrawerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isDrawerOpen]);

    // Parse URL query parameters on mount or URL changes
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const keywordParam = queryParams.get('keyword') || '';
        const categoryParam = queryParams.get('category') || '';
        
        setFilters(prev => ({
            ...prev,
            keyword: keywordParam,
            category: categoryParam
        }));
    }, [location.search]);

    // Fetch items whenever active tab type or filters change
    useEffect(() => {
        fetchItems();
        setVisibleCount(8); // Reset pagination count on filter change
    }, [activeType, filters]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const params = {
                keyword: filters.keyword,
                category: filters.category,
                location: filters.location,
                dateFrom: filters.dateFrom,
                dateTo: filters.dateTo,
                sort: filters.sort
            };

            let allItems = [];

            if (activeType === 'all' || activeType === 'lost') {
                const lostResponse = await api.get('/items/lost', { params });
                const lostItems = lostResponse.data.map(item => ({ ...item, type: 'lost' }));
                allItems = [...allItems, ...lostItems];
            }

            if (activeType === 'all' || activeType === 'found') {
                const foundResponse = await api.get('/items/found', { params });
                const foundItems = foundResponse.data.map(item => ({ ...item, type: 'found' }));
                allItems = [...allItems, ...foundItems];
            }

            // Sort combined list correctly
            allItems.sort((a, b) => {
                const dateA = new Date(a.date_lost || a.date_found || a.created_at);
                const dateB = new Date(b.date_lost || b.date_found || b.created_at);
                return filters.sort === 'oldest' ? dateA - dateB : dateB - dateA;
            });

            setItems(allItems);
        } catch (error) {
            console.error('Failed to load search results:', error);
            showToast('Failed to fetch items matching filters.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
    };

    const clearFilters = () => {
        setFilters({
            keyword: '',
            category: '',
            location: '',
            dateFrom: '',
            dateTo: '',
            sort: 'newest'
        });
        showToast('Search filters cleared.', 'info');
    };

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 8);
    };

    const slicedItems = items.slice(0, visibleCount);

    return (
        <div className="search-page">
            <div className="container">
                <div className="search-header">
                    <h1>Reported Items Catalog</h1>
                    <p className="section-subtitle">Browse and filter lost & found items reported across campus</p>
                </div>

                {/* Main Filter Tabs */}
                <div className="type-tabs">
                    <button
                        className={`type-tab ${activeType === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveType('all')}
                    >
                        All Items ({items.length})
                    </button>
                    <button
                        className={`type-tab ${activeType === 'lost' ? 'active' : ''}`}
                        onClick={() => setActiveType('lost')}
                    >
                        Lost Items
                    </button>
                    <button
                        className={`type-tab ${activeType === 'found' ? 'active' : ''}`}
                        onClick={() => setActiveType('found')}
                    >
                        Found Items
                    </button>
                </div>

                {/* Mobile Filter Toggle Button */}
                <button
                    className="btn btn-secondary mobile-filter-toggle"
                    onClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
                >
                    {sidebarMobileOpen ? 'Close Advanced Filters' : 'Open Advanced Filters ⚙️'}
                </button>

                {/* Grid Split-screen Layout */}
                <div className="search-layout">
                    {/* Collapsible advanced sidebar */}
                    <aside className={`search-sidebar ${sidebarMobileOpen ? 'mobile-open' : ''}`}>
                        <div className="sidebar-title">
                            <span>Filters</span>
                            {Object.values(filters).some(x => x !== '' && x !== 'newest') && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary-600)', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Reset
                                </button>
                            )}
                        </div>

                        <div className="sidebar-section">
                            <label className="form-label">Keyword</label>
                            <input
                                type="text"
                                name="keyword"
                                className="form-input"
                                placeholder="Search title or text..."
                                value={filters.keyword}
                                onChange={handleFilterChange}
                            />
                        </div>

                        <div className="sidebar-section">
                            <label className="form-label">Category</label>
                            <select
                                name="category"
                                className="form-select"
                                value={filters.category}
                                onChange={handleFilterChange}
                            >
                                <option value="">All Categories</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Documents">Documents</option>
                                <option value="Accessories">Accessories</option>
                                <option value="Clothing">Clothing</option>
                                <option value="Books">Books</option>
                                <option value="Keys">Keys</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="sidebar-section">
                            <label className="form-label">Building / Area</label>
                            <input
                                type="text"
                                name="location"
                                className="form-input"
                                placeholder="e.g. Library, Science Hall"
                                value={filters.location}
                                onChange={handleFilterChange}
                            />
                        </div>

                        <div className="sidebar-section">
                            <label className="form-label">Date From</label>
                            <input
                                type="date"
                                name="dateFrom"
                                className="form-input"
                                value={filters.dateFrom}
                                onChange={handleFilterChange}
                            />
                        </div>

                        <div className="sidebar-section">
                            <label className="form-label">Date To</label>
                            <input
                                type="date"
                                name="dateTo"
                                className="form-input"
                                value={filters.dateTo}
                                onChange={handleFilterChange}
                            />
                        </div>

                        <div className="sidebar-section">
                            <label className="form-label">Sorting</label>
                            <select
                                name="sort"
                                className="form-select"
                                value={filters.sort}
                                onChange={handleFilterChange}
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>
                    </aside>

                    {/* Main Results Container */}
                    <main className="search-results-area">
                        {/* Control Bar (Status + Toggles) */}
                        <div className="results-control-bar">
                            <div className="results-count">
                                Showing {slicedItems.length} of {items.length} Reports
                            </div>
                            <div className="view-toggles">
                                <button
                                    className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                    onClick={() => setViewMode('grid')}
                                    aria-label="Grid View"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="7" height="7"/>
                                        <rect x="14" y="3" width="7" height="7"/>
                                        <rect x="14" y="14" width="7" height="7"/>
                                        <rect x="3" y="14" width="7" height="7"/>
                                    </svg>
                                    Grid
                                </button>
                                <button
                                    className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                                    onClick={() => setViewMode('list')}
                                    aria-label="List View"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="8" y1="6" x2="21" y2="6"/>
                                        <line x1="8" y1="12" x2="21" y2="12"/>
                                        <line x1="8" y1="18" x2="21" y2="18"/>
                                        <line x1="3" y1="6" x2="3.01" y2="6"/>
                                        <line x1="3" y1="12" x2="3.01" y2="12"/>
                                        <line x1="3" y1="18" x2="3.01" y2="18"/>
                                    </svg>
                                    List
                                </button>
                            </div>
                        </div>

                        {/* Search Results rendering */}
                        {loading ? (
                            <div className="flex items-center justify-center" style={{ minHeight: '300px' }}>
                                <div className="spinner"></div>
                            </div>
                        ) : slicedItems.length > 0 ? (
                            viewMode === 'grid' ? (
                                <div className="grid grid-3">
                                    {slicedItems.map((item) => (
                                        <ItemCard
                                            key={`${item.type}-${item.id}`}
                                            item={item}
                                            type={item.type}
                                            onQuickView={openQuickView}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="dense-list-view table-responsive">
                                    <table className="dense-table">
                                        <thead>
                                            <tr>
                                                <th>Image</th>
                                                <th>Item ID</th>
                                                <th>Item Name</th>
                                                <th>Category</th>
                                                <th>Location</th>
                                                <th>Date Reported</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {slicedItems.map((item) => {
                                                const imageUrl = item.image_path?.startsWith('http')
                                                    ? item.image_path
                                                    : item.image_path
                                                        ? `/uploads/${item.image_path}`
                                                        : null;

                                                const dateVal = new Date(item.date_lost || item.date_found || item.created_at).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric'
                                                });
                                                return (
                                                    <tr key={`${item.type}-${item.id}`} onClick={() => openQuickView(item, item.type)} style={{ cursor: 'pointer' }}>
                                                        <td>
                                                            {imageUrl ? (
                                                                <img
                                                                    src={imageUrl}
                                                                    alt={item.item_name}
                                                                    className="item-list-image"
                                                                />
                                                            ) : (
                                                                <div className="item-list-placeholder">📦</div>
                                                            )}
                                                        </td>
                                                        <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '11px' }}>
                                                            {item.unique_id || 'N/A'}
                                                        </td>
                                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                            {item.item_name}
                                                        </td>
                                                        <td>{item.category}</td>
                                                        <td>{item.last_known_location || item.location_found}</td>
                                                        <td>{dateVal}</td>
                                                        <td>
                                                            <span className={`badge badge-${item.type}`}>
                                                                {item.type}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                className="row-action-link"
                                                                style={{ background: 'none', border: 'none', color: 'var(--primary-600)', font: 'inherit', cursor: 'pointer', padding: 0 }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openQuickView(item, item.type);
                                                                }}
                                                            >
                                                                Details →
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">🔍</div>
                                <h3>No items found</h3>
                                <p>Try adjusting your keywords or clearing advanced search filters.</p>
                            </div>
                        )}

                        {/* Responsive pagination load-more button */}
                        {!loading && items.length > visibleCount && (
                            <div className="load-more-block">
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleLoadMore}
                                >
                                    Load More Items
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Accessible Right-Drawer Quick-View Panel */}
            <div className={`quickview-overlay ${isDrawerOpen ? 'active' : ''}`} onClick={closeQuickView}>
                <div 
                    className={`quickview-drawer glassmorphism ${isDrawerOpen ? 'active' : ''}`} 
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Item Quick View Details"
                    style={{ willChange: 'transform' }}
                >
                    {selectedItem && (
                        <div className="quickview-content animate-fade-in">
                            <div className="quickview-header">
                                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-xs)' }}>
                                    <span className={`badge badge-${selectedItem.type}`}>
                                        {selectedItem.type === 'lost' ? '🔍 Lost' : '✅ Found'}
                                    </span>
                                    <button 
                                        type="button" 
                                        className="quickview-close-btn" 
                                        onClick={closeQuickView} 
                                        aria-label="Close details dialog"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <h2 className="quickview-title">{selectedItem.item_name}</h2>
                                {selectedItem.unique_id && (
                                    <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                        #{selectedItem.unique_id}
                                    </div>
                                )}
                            </div>

                            <div className="quickview-body">
                                {/* Image display */}
                                <div className="quickview-image-container">
                                    {selectedItem.image_path ? (
                                        <img 
                                            src={
                                                selectedItem.image_path.startsWith('http')
                                                    ? selectedItem.image_path
                                                    : `/uploads/${selectedItem.image_path}`
                                            } 
                                            alt={selectedItem.item_name} 
                                        />
                                    ) : (
                                        <div className="quickview-image-fallback">
                                            <span>📦</span>
                                            <p>No Photo Provided</p>
                                        </div>
                                    )}
                                </div>

                                {/* Structured info sheet */}
                                <div className="quickview-sheet">
                                    <div className="sheet-row">
                                        <span className="sheet-lbl">Category</span>
                                        <span className="sheet-val">{selectedItem.category}</span>
                                    </div>
                                    <div className="sheet-row">
                                        <span className="sheet-lbl">Campus Area</span>
                                        <span className="sheet-val">
                                            {selectedItem.last_known_location || selectedItem.location_found}
                                        </span>
                                    </div>
                                    <div className="sheet-row">
                                        <span className="sheet-lbl">Date Reported</span>
                                        <span className="sheet-val">
                                            {new Date(selectedItem.date_lost || selectedItem.date_found || selectedItem.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="sheet-row">
                                        <span className="sheet-lbl">Item Status</span>
                                        <span className={`badge ${selectedItem.status === 'active' ? 'badge-active' : 'badge-recovered'}`}>
                                            {selectedItem.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Brief details */}
                                <div className="quickview-desc-section">
                                    <h4 style={{ marginBottom: '0.35rem' }}>Description details</h4>
                                    <p style={{ fontSize: 'var(--font-size-xs)', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                                        {selectedItem.description}
                                    </p>
                                </div>
                            </div>

                            <div className="quickview-footer">
                                <Link 
                                    to={`/items/${selectedItem.type}/${selectedItem.id}`} 
                                    className="btn btn-primary" 
                                    style={{ width: '100%', textAlign: 'center', display: 'block' }}
                                    onClick={closeQuickView}
                                >
                                    View Full Recovery Sheet
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Toast toasts={toasts} />
        </div>
    );
};

export default Search;
