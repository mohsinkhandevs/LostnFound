import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import Toast, { useToast } from '../components/Toast';
import './MyItems.css';

const MyItems = () => {
    const navigate = useNavigate();
    const { toasts, showToast } = useToast();

    // Tab state: 'lost' (My Lost Reports), 'found' (My Found Reports), 'claims' (Claim Matches)
    const [activeTab, setActiveTab] = useState('lost');

    const [lostItems, setLostItems] = useState([]);
    const [foundItems, setFoundItems] = useState([]);
    const [systemMatches, setSystemMatches] = useState([]);
    const [incomingClaims, setIncomingClaims] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Concurrently query user-reported lost and found items, matches, and incoming claims
            const [lostRes, foundRes, matchesRes, claimsRes] = await Promise.all([
                api.get('/items/lost/my'),
                api.get('/items/found/my'),
                api.get('/items/matches'),
                api.get('/items/claims/incoming')
            ]);

            const userLost = lostRes.data.map(x => ({ ...x, type: 'lost' }));
            const userFound = foundRes.data.map(x => ({ ...x, type: 'found' }));

            setLostItems(userLost);
            setFoundItems(userFound);
            setSystemMatches(matchesRes.data);
            setIncomingClaims(claimsRes.data);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            showToast('Unable to fetch reported items from database.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (type, item) => {
        if (!window.confirm(`Are you sure you want to delete this report?\n\nItem: ${item.item_name}`)) return;

        try {
            await api.delete(`/items/${type}/${item.id}`);
            showToast('Item report deleted successfully.', 'success');
            fetchData();
        } catch (error) {
            showToast('Failed to delete reported item.', 'error');
        }
    };

    const handleMarkRecovered = async (id) => {
        try {
            await api.patch(`/items/lost/${id}/recover`);
            showToast('Report updated: Marked as Recovered!', 'success');
            fetchData();
        } catch (error) {
            showToast('Failed to update report status.', 'error');
        }
    };

    const handleMarkClosed = async (id) => {
        try {
            await api.patch(`/items/found/${id}/close`);
            showToast('Report updated: Marked as Closed!', 'success');
            fetchData();
        } catch (error) {
            showToast('Failed to update report status.', 'error');
        }
    };

    const handleApproveClaim = async (claimId) => {
        if (!window.confirm("Are you sure you want to approve this claim? This will close your found report and mark the item as resolved.")) return;

        try {
            await api.patch(`/items/claims/${claimId}/approve`);
            showToast("Claim approved successfully! The portal report is resolved.", "success");
            fetchData();
        } catch (error) {
            console.error("Approve claim failed:", error);
            showToast(error.response?.data?.error || "Failed to approve claim.", "error");
        }
    };

    const handleRejectClaim = async (claimId) => {
        if (!window.confirm("Are you sure you want to reject this claimant's proof?")) return;

        try {
            await api.patch(`/items/claims/${claimId}/reject`);
            showToast("Claim rejected.", "info");
            fetchData();
        } catch (error) {
            console.error("Reject claim failed:", error);
            showToast(error.response?.data?.error || "Failed to reject claim.", "error");
        }
    };

    const currentList = activeTab === 'lost' ? lostItems : foundItems;

    return (
        <div className="my-items-page animate-fade-in">
            <div className="container">
                {/* Header Actions */}
                <div className="my-items-header">
                    <div>
                        <h1>My Reports Dashboard</h1>
                        <p className="section-subtitle">Manage your lost listings, verified found items, and match notifications</p>
                    </div>
                    <div className="header-actions">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/report-lost')}>
                            🔍 Report Lost Item
                        </button>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/report-found')}>
                            ✅ Report Found Item
                        </button>
                    </div>
                </div>

                {/* Navigation Dashboard Tabs */}
                <div className="my-items-tabs">
                    <button
                        type="button"
                        className={`tab-button ${activeTab === 'lost' ? 'active' : ''}`}
                        onClick={() => setActiveTab('lost')}
                    >
                        My Lost Reports ({lostItems.length})
                    </button>
                    <button
                        type="button"
                        className={`tab-button ${activeTab === 'found' ? 'active' : ''}`}
                        onClick={() => setActiveTab('found')}
                    >
                        My Found Reports ({foundItems.length})
                    </button>
                    <button
                        type="button"
                        className={`tab-button ${activeTab === 'claims' ? 'active' : ''}`}
                        onClick={() => setActiveTab('claims')}
                    >
                        Matching Alerts ({systemMatches.length})
                    </button>
                    <button
                        type="button"
                        className={`tab-button ${activeTab === 'incoming' ? 'active' : ''}`}
                        onClick={() => setActiveTab('incoming')}
                    >
                        Claims Received ({incomingClaims.length})
                    </button>
                </div>

                {/* Tab content panel */}
                <div className="my-items-content">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center" style={{ minHeight: '300px' }}>
                            <div className="spinner"></div>
                            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Synchronizing listings...</p>
                        </div>
                    ) : activeTab === 'claims' ? (
                        /* Claim Notifications matches */
                        systemMatches.length > 0 ? (
                            <div className="claims-notifications-list animate-fade-in">
                                {systemMatches.map((match) => {
                                    const lostItem = match.lost_item_id;
                                    const foundItem = match.found_item_id;
                                    if (!lostItem || !foundItem) return null;

                                    return (
                                        <div key={match._id} className="claim-alert-card glassmorphism">
                                            <div className="claim-alert-icon float-interactive">✨</div>
                                            <div className="claim-alert-details">
                                                <div className="claim-alert-title">
                                                    Intelligent Match Alert: {lostItem.item_name}
                                                </div>
                                                <p className="claim-alert-desc">
                                                    A potential matching "{foundItem.item_name}" was reported found at "{foundItem.location_found}".
                                                </p>
                                                <p className="claim-alert-desc" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                                    Confidence level: <strong>{match.score}% match score</strong> • Status: <strong style={{ textTransform: 'uppercase' }}>{match.status}</strong>
                                                </p>
                                            </div>
                                            <div className="claim-alert-actions">
                                                <Link
                                                    to={`/items/lost/${lostItem._id}`}
                                                    className="btn btn-secondary btn-xs"
                                                    style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center' }}
                                                >
                                                    🔍 View Lost Details
                                                </Link>
                                                <Link
                                                    to={`/items/found/${foundItem._id}`}
                                                    className="btn btn-secondary btn-xs"
                                                    style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center' }}
                                                >
                                                    ✅ View Found Details
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="empty-state animate-fade-in">
                                <span className="empty-icon">🔔</span>
                                <h3>No matching alerts yet</h3>
                                <p>Our campus AI scanner is continually auditing logs. You will be alerted instantly upon a category and keyword match.</p>
                            </div>
                        )
                    ) : activeTab === 'incoming' ? (
                        /* Received Claims list */
                        incomingClaims.length > 0 ? (
                            <div className="claims-notifications-list animate-fade-in">
                                {incomingClaims.map((claim) => (
                                    <div key={claim.id} className="claim-alert-card glassmorphism">
                                        <div className="claim-alert-icon float-interactive">🛡️</div>
                                        <div className="claim-alert-details">
                                            <div className="claim-alert-title">
                                                Claim for: <Link to={`/items/found/${claim.found_item_id}`} style={{ color: 'inherit', fontWeight: 600 }}>{claim.item_name}</Link>
                                            </div>
                                            <div style={{ margin: 'var(--spacing-xs) 0', fontSize: 'var(--font-size-xs)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Claimant Student ID: <strong style={{ color: 'var(--text-primary)' }}>{claim.student_id}</strong></span>
                                                <span style={{ color: 'var(--text-secondary)' }}>Ownership Proof: <em style={{ color: 'var(--text-primary)' }}>"{claim.proof_text}"</em></span>
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                                Status: <strong style={{ textTransform: 'uppercase', color: claim.status === 'approved' ? 'var(--success)' : claim.status === 'rejected' ? 'var(--danger)' : 'var(--warning)' }}>{claim.status}</strong> • Filed: {new Date(claim.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        {claim.status === 'pending' && (
                                            <div className="claim-alert-actions" style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary btn-xs"
                                                    onClick={() => handleApproveClaim(claim.id)}
                                                    style={{ width: '120px' }}
                                                >
                                                    Approve Claim
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-xs"
                                                    onClick={() => handleRejectClaim(claim.id)}
                                                    style={{ width: '120px' }}
                                                >
                                                    Reject Claim
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state animate-fade-in">
                                <span className="empty-icon">📦</span>
                                <h3>No claims received yet</h3>
                                <p>When a claimant submits their ID and verification details for your found items, they will appear here for review.</p>
                            </div>
                        )
                    ) : currentList.length > 0 ? (
                        /* Dense management data table */
                        <div className="dense-list-view table-responsive animate-fade-in">
                            <table className="dense-table">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>ID Number</th>
                                        <th>Item Name</th>
                                        <th>Category</th>
                                        <th>Campus Location</th>
                                        <th>Date Reported</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Dashboard Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentList.map((item) => {
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
                                            <tr key={`${item.type}-${item.id}`}>
                                                <td>
                                                    {imageUrl ? (
                                                        <img
                                                            src={imageUrl}
                                                            alt={item.item_name}
                                                            className="thumbnail-col-img"
                                                        />
                                                    ) : (
                                                        <div className="thumbnail-col-fallback">📦</div>
                                                    )}
                                                </td>
                                                <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '11px' }}>
                                                    {item.unique_id || 'N/A'}
                                                </td>
                                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    <Link to={`/items/${item.type}/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                        {item.item_name}
                                                    </Link>
                                                </td>
                                                <td>{item.category}</td>
                                                <td>{item.last_known_location || item.location_found}</td>
                                                <td>{dateVal}</td>
                                                <td>
                                                    <span className={`badge badge-${item.status === 'active' ? 'active' : 'recovered'}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                                                        <Link
                                                            to={`/items/${item.type}/${item.id}`}
                                                            className="btn btn-secondary btn-xs"
                                                            style={{ textDecoration: 'none' }}
                                                        >
                                                            View
                                                        </Link>
                                                        {item.status === 'active' && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-primary btn-xs"
                                                                onClick={() =>
                                                                    item.type === 'lost'
                                                                        ? handleMarkRecovered(item.id)
                                                                        : handleMarkClosed(item.id)
                                                                }
                                                            >
                                                                Resolve
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            className="btn btn-danger btn-xs"
                                                            onClick={() => handleDelete(item.type, item)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state animate-fade-in">
                            <span className="empty-icon">📦</span>
                            <h3>No active reports found</h3>
                            <p>You have not logged any {activeTab} items yet. Click one of the buttons above to register a report.</p>
                        </div>
                    )}
                </div>
            </div>
            <Toast toasts={toasts} />
        </div>
    );
};

export default MyItems;