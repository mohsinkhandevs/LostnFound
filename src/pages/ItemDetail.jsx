import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Toast, { useToast } from '../components/Toast';
import './ItemDetail.css';

const ItemDetail = () => {
    const { type, id } = useParams();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toasts, showToast } = useToast();

    // Confetti and Claim Proof States
    const [showConfetti, setShowConfetti] = useState(false);
    const [claimProofText, setClaimProofText] = useState('');
    const [claimStudentId, setClaimStudentId] = useState('');
    const [myClaims, setMyClaims] = useState([]);
    const [submittingClaim, setSubmittingClaim] = useState(false);

    useEffect(() => {
        fetchItem();
    }, [type, id, user]);

    const fetchItem = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/items/${type}/${id}`);
            setItem(response.data);

            if (user && type === 'found') {
                const claimsRes = await api.get('/items/claims/my');
                setMyClaims(claimsRes.data);
            }
        } catch (error) {
            console.error('Failed to fetch item details:', error);
            showToast('Unable to fetch item records from backend.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete this ${type} item report?\n\nItem: ${item.item_name}`)) return;

        try {
            const endpoint = isAdmin
                ? `/admin/items/${type}/${id}`
                : `/items/${type}/${id}`;

            await api.delete(endpoint);
            showToast('Item deleted successfully.', 'success');
            setTimeout(() => {
                navigate('/my-items');
            }, 1500);
        } catch (error) {
            showToast('Failed to delete reported item.', 'error');
        }
    };

    const handleMarkRecovered = async () => {
        if (!window.confirm(`Are you sure you want to mark this item as recovered?\n\nItem: ${item.item_name}`)) return;

        try {
            if (isAdmin) {
                await api.patch(`/admin/close/lost/${id}`);
            } else {
                await api.patch(`/items/lost/${id}/recover`);
            }
            showToast('Item marked as recovered successfully!', 'success');
            
            // Trigger pure CSS Confetti storm
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 4500);
            
            fetchItem();
        } catch (error) {
            showToast('Failed to update recovery status.', 'error');
        }
    };

    const handleMarkClosed = async () => {
        if (!window.confirm(`Are you sure you want to mark this found item as closed?\n\nItem: ${item.item_name}`)) return;

        try {
            if (isAdmin) {
                await api.patch(`/admin/close/found/${id}`);
            } else {
                await api.patch(`/items/found/${id}/close`);
            }
            showToast('Found item marked as closed!', 'success');
            
            // Trigger pure CSS Confetti storm
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 4500);
            
            fetchItem();
        } catch (error) {
            showToast('Failed to close found item.', 'error');
        }
    };

    if (loading) {
        return (
            <div className="item-detail-page">
                <div className="container">
                    <div className="flex flex-col items-center justify-center" style={{ minHeight: '300px' }}>
                        <div className="spinner"></div>
                        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Retrieving report details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="item-detail-page">
                <div className="container">
                    <div className="empty-state">
                        <span className="empty-icon">⚠️</span>
                        <h3>Item Report Not Found</h3>
                        <p>The record might have been resolved, deleted, or suspended by moderators.</p>
                        <button className="btn btn-primary mt-md" onClick={() => navigate('/reportedItems')}>
                            Back to Reported Items
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const imageUrl = item.image_path?.startsWith('http')
        ? item.image_path
        : item.image_path
            ? `/uploads/${item.image_path}`
            : null;

    const location = type === 'lost' ? item.last_known_location : item.location_found;
    const date = type === 'lost' ? item.date_lost : item.date_found;

    // Check permissions
    const isOwner = user?.id === item.user_id;
    const isAdmin = user?.role === 'admin';
    const canManage = isOwner || isAdmin;

    // Calculate timeline stage configurations dynamically
    const isClosed = item.status === 'recovered' || item.status === 'closed';

    const existingClaim = type === 'found' ? myClaims.find(c => c.found_item_id === id) : null;

    // Celebrate with confetti if claimant returns and sees their claim is approved
    useEffect(() => {
        if (existingClaim && existingClaim.status === 'approved' && !showConfetti) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [existingClaim, showConfetti]);

    const handleSubmitClaim = async (e) => {
        if (e) e.preventDefault();
        if (!claimStudentId.trim() || !claimProofText.trim()) return;

        try {
            setSubmittingClaim(true);
            const res = await api.post(`/items/found/${id}/claim`, {
                studentId: claimStudentId.trim(),
                proofText: claimProofText.trim()
            });

            showToast(res.data.message || 'Ownership claim submitted successfully!', 'success');
            
            // Re-fetch claims from backend
            const claimsRes = await api.get('/items/claims/my');
            setMyClaims(claimsRes.data);
            
            // Clear claim inputs
            setClaimStudentId('');
            setClaimProofText('');
        } catch (error) {
            console.error('Claim submission error:', error);
            showToast(error.response?.data?.error || 'Failed to submit ownership claim.', 'error');
        } finally {
            setSubmittingClaim(false);
        }
    };

    return (
        <div className="item-detail-page">
            {/* Pure CSS Confetti Storm Overlays */}
            {showConfetti && (
                <div className="confetti-container">
                    {Array.from({ length: 120 }).map((_, idx) => {
                        const randomX = Math.floor(Math.random() * 200) - 100 + 'vw';
                        const randomRot = Math.floor(Math.random() * 360) + 360 + 'deg';
                        const randomDelay = (Math.random() * 3.5).toFixed(2) + 's';
                        const randomLeft = Math.floor(Math.random() * 100) + 'vw';
                        const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6'];
                        const randomColor = colors[Math.floor(Math.random() * colors.length)];
                        
                        return (
                            <div 
                                key={idx}
                                className="confetti-piece"
                                style={{
                                    left: randomLeft,
                                    backgroundColor: randomColor,
                                    '--x-random': randomX,
                                    '--rot-random': randomRot,
                                    animationDelay: randomDelay,
                                }}
                            />
                        );
                    })}
                </div>
            )}

            <div className="container">
                {/* Back navigation */}
                <button className="btn btn-secondary btn-sm mb-md" onClick={() => navigate(-1)}>
                    ← Back to List
                </button>

                {/* 2-Column Split Details Grid */}
                <div className="detail-grid-layout animate-fade-in">
                    {/* Left Column: Image Panel Card */}
                    <div className="detail-image-card">
                        <div className="detail-image-container">
                            {imageUrl ? (
                                <img src={imageUrl} alt={item.item_name} />
                            ) : (
                                <div className="detail-image-fallback">
                                    <div className="fallback-icon">📦</div>
                                    <p>No Photo Provided</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Content details & Claim info */}
                    <div className="detail-content-card">
                        {/* Header Details */}
                        <div className="detail-header-block">
                            <div className="detail-meta-row">
                                <span className={`badge badge-${type}`}>
                                    {type === 'lost' ? '🔍 Lost Item' : '✅ Found Item'}
                                </span>
                                {item.unique_id && (
                                    <span className={`badge badge-active`} style={{ fontFamily: 'monospace' }}>
                                        #{item.unique_id}
                                    </span>
                                )}
                            </div>
                            <h1 className="detail-title">{item.item_name}</h1>
                            <span className={`badge ${item.status === 'active' ? 'badge-active' : 'badge-recovered'}`}>
                                Status: {item.status}
                            </span>
                        </div>

                        {/* Status Progress Timeline */}
                        <div className="timeline-block">
                            <div className="timeline-title">Item Recovery Lifecycle</div>
                            <div className="timeline-flow">
                                <div className="timeline-node completed">
                                    <div className="timeline-circle">1</div>
                                    <span className="timeline-label">Reported</span>
                                </div>
                                <div className="timeline-node completed">
                                    <div className="timeline-circle">2</div>
                                    <span className="timeline-label">Verified</span>
                                </div>
                                <div className={`timeline-node ${isClosed ? 'completed' : 'active'}`}>
                                    <div className="timeline-circle">3</div>
                                    <span className="timeline-label">Matching</span>
                                </div>
                                <div className={`timeline-node ${isClosed ? 'completed' : ''}`}>
                                    <div className="timeline-circle">4</div>
                                    <span className="timeline-label">Reunited</span>
                                </div>
                            </div>
                        </div>

                        {/* Description Section */}
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <h4 style={{ marginBottom: '0.5rem' }}>Description Details</h4>
                            <p style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                                {item.description}
                            </p>
                        </div>

                        {/* Structured Key Value Grid */}
                        <div className="details-sheet">
                            <div className="sheet-item">
                                <span className="sheet-label">Category</span>
                                <span className="sheet-value">{item.category}</span>
                            </div>
                            <div className="sheet-item">
                                <span className="sheet-label">Reporting Date</span>
                                <span className="sheet-value">{new Date(date).toLocaleDateString()}</span>
                            </div>
                            <div className="sheet-item">
                                <span className="sheet-label">Building / Area</span>
                                <span className="sheet-value">{location}</span>
                            </div>
                            <div className="sheet-item">
                                <span className="sheet-label">Log Created</span>
                                <span className="sheet-value">{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Interactive Claimant Proof Questionnaire Panel */}
                        {!canManage && type === 'found' && (
                            <div className="claim-action-card animate-fade-in">
                                {!user ? (
                                    <div style={{ textAlign: 'center', padding: 'var(--spacing-md) 0' }}>
                                        <div className="disclaimer-header" style={{ justifyContent: 'center' }}>
                                            <span>🔒 Claim Verification Locked</span>
                                        </div>
                                        <p className="disclaimer-body" style={{ margin: 'var(--spacing-sm) 0' }}>
                                            Please log in to submit your student credentials and ownership proof for this item.
                                        </p>
                                        <Link to="/login" className="btn btn-secondary btn-sm" style={{ display: 'inline-block', marginTop: 'var(--spacing-xs)' }}>
                                            Go to Sign In
                                        </Link>
                                    </div>
                                ) : existingClaim ? (
                                    <div className="claim-status-panel">
                                        <div className="disclaimer-header">
                                            <span>🛡️ Claim Status: <span style={{
                                                textTransform: 'uppercase',
                                                fontWeight: 'bold',
                                                color: existingClaim.status === 'approved' ? 'var(--success)' : existingClaim.status === 'rejected' ? 'var(--danger)' : 'var(--warning)'
                                            }}>{existingClaim.status}</span></span>
                                        </div>
                                        <div className="disclaimer-body" style={{ marginTop: 'var(--spacing-sm)', color: 'var(--text-secondary)' }}>
                                            {existingClaim.status === 'pending' && "Your verification claim has been submitted and is currently under review by the finder. You will be notified here once the finder updates the status."}
                                            {existingClaim.status === 'approved' && "🎉 Your ownership claim has been verified and approved by the finder! The item is now closed. Please coordinate collection details."}
                                            {existingClaim.status === 'rejected' && "Your ownership claim has been rejected. If you believe this is in error, please make sure your proof details are correct or contact portal support."}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="disclaimer-header">
                                            <span>🛡️ Claim Ownership Verification</span>
                                        </div>
                                        <div className="disclaimer-body">
                                            To query this item, please submit your ownership details below. This constructs an official campus recovery claim directly to the finder ({item.full_name}).
                                        </div>
                                        
                                        <form onSubmit={handleSubmitClaim} className="claimant-form-fields" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', margin: 'var(--spacing-md) 0' }}>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label className="form-label" style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                                                    Your Campus Student ID *
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="e.g. 2026-10492"
                                                    value={claimStudentId}
                                                    onChange={(e) => setClaimStudentId(e.target.value)}
                                                    style={{ padding: '0.45rem 0.75rem', fontSize: 'var(--font-size-xs)' }}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label className="form-label" style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                                                    Ownership Proof / Unique characteristics *
                                                </label>
                                                <textarea
                                                    className="form-textarea"
                                                    placeholder="Describe serials, keyrings, screen stickers, or inner wallet contents..."
                                                    value={claimProofText}
                                                    onChange={(e) => setClaimProofText(e.target.value)}
                                                    style={{ padding: '0.5rem 0.75rem', fontSize: 'var(--font-size-xs)', minHeight: '70px' }}
                                                    required
                                                />
                                            </div>
                                            
                                            <button 
                                                type="submit"
                                                className="btn btn-primary" 
                                                disabled={submittingClaim || !claimStudentId.trim() || !claimProofText.trim()}
                                                style={{ 
                                                    width: '100%', 
                                                    textAlign: 'center', 
                                                    marginTop: 'var(--spacing-xs)',
                                                    opacity: (!claimStudentId.trim() || !claimProofText.trim()) ? 0.6 : 1
                                                }}
                                            >
                                                {submittingClaim ? 'Submitting Claim...' : '✉️ Submit Proof to Finder'}
                                            </button>
                                        </form>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Owner/Admin Manage Panel */}
                        {canManage && (
                            <div className="manage-panel">
                                <h4 style={{ color: 'var(--text-primary)' }}>Manage Report Control</h4>
                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                    {isOwner
                                        ? "You are logged in as the report owner. You can resolve or delete this entry."
                                        : "Administrative override active. You have full edit/delete privileges for this entry."}
                                </p>
                                <div className="manage-actions-row">
                                    {type === 'lost' && item.status === 'active' && (
                                        <button
                                            type="button"
                                            className="btn btn-primary animate-pulse"
                                            onClick={handleMarkRecovered}
                                        >
                                            ✓ Mark as Recovered
                                        </button>
                                    )}
                                    {type === 'found' && item.status === 'active' && (
                                        <button
                                            type="button"
                                            className="btn btn-primary animate-pulse"
                                            onClick={handleMarkClosed}
                                        >
                                            ✓ Mark as Closed
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        onClick={handleDelete}
                                    >
                                        🗑 Delete Entry
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Toast toasts={toasts} />
        </div>
    );
};

export default ItemDetail;
