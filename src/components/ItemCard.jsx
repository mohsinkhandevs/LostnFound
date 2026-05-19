import { Link } from 'react-router-dom';
import './ItemCard.css';

const ItemCard = ({ item, type, onQuickView }) => {
    const imageUrl = item.image_path?.startsWith('http')
        ? item.image_path
        : item.image_path
            ? `/uploads/${item.image_path}`
            : null;

    const getStatusBadge = () => {
        if (type === 'lost') {
            return item.status === 'recovered'
                ? <span className="badge badge-success">Recovered</span>
                : <span className="badge badge-info">Active</span>;
        } else {
            return item.status === 'closed'
                ? <span className="badge badge-success">Closed</span>
                : <span className="badge badge-info">Active</span>;
        }
    };

    const location = type === 'lost' ? item.last_known_location : item.location_found;
    const date = type === 'lost' ? item.date_lost : item.date_found;

    const handleClick = (e) => {
        if (onQuickView) {
            e.preventDefault();
            onQuickView(item, type);
        }
    };

    return (
        <Link to={`/item/${type}/${item.id}`} className="item-card" onClick={handleClick}>
            <div className="item-card-image">
                {imageUrl ? (
                    <img src={imageUrl} alt={item.item_name} />
                ) : (
                    <div className="item-card-placeholder">
                        <span className="placeholder-icon">📦</span>
                    </div>
                )}
                <div className="item-card-badges">
                    <span className={`badge ${type === 'lost' ? 'badge-lost' : 'badge-found'}`}>
                        {type === 'lost' ? '🔍 Lost' : '✅ Found'}
                    </span>
                    {getStatusBadge()}
                </div>
            </div>

            <div className="item-card-content">
                {item.unique_id && (
                    <div className="item-card-id">#{item.unique_id}</div>
                )}
                <h3 className="item-card-title">{item.item_name}</h3>
                <p className="item-card-category">{item.category}</p>
                <p className="item-card-description">{item.description}</p>

                <div className="item-card-footer">
                    <div className="item-card-info">
                        <span className="info-icon">📍</span>
                        <span className="info-text">{location}</span>
                    </div>
                    <div className="item-card-info">
                        <span className="info-icon">📅</span>
                        <span className="info-text">{new Date(date).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ItemCard;
