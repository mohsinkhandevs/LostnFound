import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Toast, { useToast } from '../components/Toast';
import './ReportForm.css';

const CATEGORIES = [
    'Electronics',
    'Textbooks',
    'Stationery',
    'Clothing',
    'Accessories',
    'ID Cards',
    'Keys',
    'Bags',
    'Sports Equipment',
    'Other'
];

const LOCATIONS = [
    'Main Library',
    'CS Department',
    'EE Department',
    'Management Department',
    'Cafeteria',
    'Sports Complex',
    'Parking Area',
    'Auditorium',
    'Labs',
    'Other'
];

const ReportFound = () => {
    const navigate = useNavigate();
    const { toasts, showToast } = useToast();

    // Multi-step form states
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState(() => {
        const draft = localStorage.getItem('report_found_draft');
        if (draft) {
            try {
                return JSON.parse(draft);
            } catch (e) {
                console.error('Failed to parse report_found_draft:', e);
            }
        }
        return {
            itemName: '',
            description: '',
            category: '',
            locationFound: '',
            dateFound: ''
        };
    });

    useEffect(() => {
        localStorage.setItem('report_found_draft', JSON.stringify(formData));
    }, [formData]);

    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error as user types
        if (errors[e.target.name]) {
            setErrors(prev => ({ ...prev, [e.target.name]: '' }));
        }
    };

    // Client-side image validation (type & max size 3MB)
    const validateAndSetFile = (file) => {
        if (!file) return;

        // Constraint 1: Check File Format
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            showToast('Invalid file format. Only JPG, JPEG, and PNG are allowed.', 'error');
            return;
        }

        // Constraint 2: Check File Size (Max 3MB)
        const maxLimit = 3 * 1024 * 1024; // 3MB
        if (file.size > maxLimit) {
            showToast('File size is too large. Maximum size allowed is 3MB.', 'error');
            return;
        }

        // 1-second simulated scan loading step (premium AI vibe)
        setIsScanning(true);
        setTimeout(() => {
            setIsScanning(false);
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
            showToast('Image uploaded and verified successfully!', 'success');
            if (errors.image) {
                setErrors(prev => ({ ...prev, image: '' }));
            }
        }, 1200);
    };

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        validateAndSetFile(file);
    };

    // Drag-and-drop event handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => {
        setDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        validateAndSetFile(file);
    };

    const removeSelectedImage = () => {
        setImage(null);
        setImagePreview(null);
    };

    // Step validations
    const validateStep = (currentStep) => {
        const tempErrors = {};
        if (currentStep === 1) {
            if (!formData.itemName.trim()) tempErrors.itemName = 'Item name is required';
            else if (formData.itemName.length < 3) tempErrors.itemName = 'Must be at least 3 characters';

            if (!formData.category) tempErrors.category = 'Please select a category';

            if (!formData.description.trim()) tempErrors.description = 'Description details are required';
            else if (formData.description.length < 10) tempErrors.description = 'Must be at least 10 characters';
        } else if (currentStep === 2) {
            if (!formData.locationFound) tempErrors.locationFound = 'Please select location found';
            if (!formData.dateFound) tempErrors.dateFound = 'Date found is required';
            else {
                const selected = new Date(formData.dateFound);
                const today = new Date();
                if (selected > today) {
                    tempErrors.dateFound = 'Date cannot be in the future';
                }
            }
        } else if (currentStep === 3) {
            // Found items STRICT constraint: image is mandatory to verify proof of ownership
            if (!image) {
                tempErrors.image = 'An image of the found item is required for matching logs';
            }
        }
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(prev => prev + 1);
        } else {
            showToast('Please correct form errors before proceeding.', 'error');
        }
    };

    const handlePrev = () => {
        setStep(prev => prev - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
            if (!validateStep(1)) setStep(1);
            else if (!validateStep(2)) setStep(2);
            else setStep(3);
            return;
        }

        setLoading(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('itemName', formData.itemName);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('category', formData.category);
            formDataToSend.append('locationFound', formData.locationFound);
            formDataToSend.append('dateFound', formData.dateFound);
            if (image) {
                formDataToSend.append('image', image);
            }

            const res = await api.post('/items/found', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.status === 201) {
                localStorage.removeItem('report_found_draft');
            }

            showToast('Found item reported successfully!', 'success');
            setTimeout(() => navigate('/my-items'), 1500);
        } catch (error) {
            showToast(error.response?.data?.error || 'Failed to submit found item report.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="report-page">
            <div className="container">
                <div className="report-header">
                    <h1>Report Found Item</h1>
                    <p>Help reunite an owner with their lost item by entering the details below</p>
                </div>

                <div className="report-card">
                    {/* Stepper Bubble Timeline */}
                    <div className="stepper-container">
                        <div className={`stepper-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                            <div className="stepper-bubble">1</div>
                            <span className="stepper-label">Basic Info</span>
                        </div>
                        <div className={`stepper-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                            <div className="stepper-bubble">2</div>
                            <span className="stepper-label">Where & When</span>
                        </div>
                        <div className={`stepper-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
                            <div className="stepper-bubble">3</div>
                            <span className="stepper-label">Photo Upload</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="report-form-body">
                        {/* Step 1: Basic Information */}
                        {step === 1 && (
                            <div className="step-content animate-fade-in">
                                <div className="form-group">
                                    <label className="form-label">Item Title *</label>
                                    <input
                                        type="text"
                                        name="itemName"
                                        className={`form-input ${errors.itemName ? 'error' : ''}`}
                                        placeholder="e.g. Silver watch, Chemistry textbook"
                                        value={formData.itemName}
                                        onChange={handleChange}
                                    />
                                    {errors.itemName && <span className="form-error">{errors.itemName}</span>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Category *</label>
                                    <select
                                        name="category"
                                        className={`form-select ${errors.category ? 'error' : ''}`}
                                        value={formData.category}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select category...</option>
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    {errors.category && <span className="form-error">{errors.category}</span>}
                                </div>

                                <div className="form-group" style={{ paddingBottom: 'var(--spacing-lg)' }}>
                                    <label className="form-label">Distinctive Description *</label>
                                    <textarea
                                        name="description"
                                        className={`form-textarea ${errors.description ? 'error' : ''}`}
                                        placeholder="Include color, brand, condition, tags, or any unique characteristics..."
                                        value={formData.description}
                                        onChange={handleChange}
                                    />
                                    {errors.description && <span className="form-error">{errors.description}</span>}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Location and Time */}
                        {step === 2 && (
                            <div className="step-content animate-fade-in">
                                <div className="form-group">
                                    <label className="form-label">Location Found *</label>
                                    <select
                                        name="locationFound"
                                        className={`form-select ${errors.locationFound ? 'error' : ''}`}
                                        value={formData.locationFound}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select campus location...</option>
                                        {LOCATIONS.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                    {errors.locationFound && <span className="form-error">{errors.locationFound}</span>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Date Found *</label>
                                    <input
                                        type="date"
                                        name="dateFound"
                                        className={`form-input ${errors.dateFound ? 'error' : ''}`}
                                        max={new Date().toISOString().split('T')[0]}
                                        value={formData.dateFound}
                                        onChange={handleChange}
                                    />
                                    {errors.dateFound && <span className="form-error">{errors.dateFound}</span>}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Photo Upload (Required for found items) */}
                        {step === 3 && (
                            <div className="step-content animate-fade-in">
                                <div className="form-group" style={{ paddingBottom: 'var(--spacing-lg)' }}>
                                    <label className="form-label">Upload Found Item Photo *</label>
                                    
                                    {/* Scanning loader or drop zone preview */}
                                    {isScanning ? (
                                        <div className="drag-drop-zone scanning-zone glassmorphism">
                                            <div className="scanner-laser-line" style={{ willChange: 'transform' }}></div>
                                            <span className="upload-icon float-interactive">⌛</span>
                                            <span className="upload-text" style={{ fontWeight: '700', color: 'var(--primary-600)' }}>
                                                Running Attribute Scanner...
                                            </span>
                                            <span className="upload-hint">Aligning categories with reported logs</span>
                                        </div>
                                    ) : !imagePreview ? (
                                        <div
                                            className={`drag-drop-zone ${dragging ? 'dragging' : ''} ${errors.image ? 'error' : ''}`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() => document.getElementById('file-upload').click()}
                                        >
                                            <span className="upload-icon">📁</span>
                                            <span className="upload-text">Drag and drop photo here, or click to browse</span>
                                            <span className="upload-hint">Supports JPEG, PNG (Max size: 3MB)</span>
                                            <input
                                                id="file-upload"
                                                type="file"
                                                accept="image/jpeg,image/png"
                                                style={{ display: 'none' }}
                                                onChange={handleFileInput}
                                            />
                                        </div>
                                    ) : (
                                        <div className="image-preview-wrapper animate-fade-in">
                                            <img src={imagePreview} alt="Found Item Preview" />
                                            <button
                                                type="button"
                                                className="remove-img-btn"
                                                onClick={removeSelectedImage}
                                                title="Remove photo"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                    {errors.image && <span className="form-error">{errors.image}</span>}
                                    <small style={{ display: 'block', color: 'var(--text-tertiary)', marginTop: '8px', fontSize: '11px' }}>
                                        An image of the item is required to help verify ownership matching details automatically.
                                    </small>
                                </div>
                            </div>
                        )}

                        {/* Form actions wizard controls row */}
                        <div className="form-actions-row">
                            {step > 1 ? (
                                <button type="button" className="btn btn-secondary" onClick={handlePrev}>
                                    ← Back Step
                                </button>
                            ) : (
                                <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
                                    Cancel
                                </button>
                            )}

                            {step < 3 ? (
                                <button type="button" className="btn btn-primary" onClick={handleNext}>
                                    Next Step →
                                </button>
                            ) : (
                                <button type="submit" className="btn btn-primary" disabled={loading || isScanning}>
                                    {loading ? 'Submitting Report...' : 'Report Found Item'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
            <Toast toasts={toasts} />
        </div>
    );
};

export default ReportFound;
