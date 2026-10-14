import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import notificationService from '../services/notificationService';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import EmptyState from '../components/common/EmptyState';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Package, 
  CreditCard, 
  Tag, 
  Info, 
  ChevronRight,
  ArrowLeft 
} from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'UNREAD'

  useEffect(() => {
    fetchNotifications(page, activeFilter);
  }, [page, activeFilter]);

  const fetchNotifications = async (pageNum = 1, filter = 'ALL') => {
    try {
      setLoading(true);
      const isReadParam = filter === 'UNREAD' ? 'false' : undefined;
      const res = await notificationService.getNotifications(pageNum, 15, isReadParam);
      const data = res.data?.data || res.data || res;
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setTotalPages(data.pagination?.pages || data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      const target = notifications.find((n) => n._id === id);
      if (target && !target.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ORDER_PLACED':
      case 'ORDER_CONFIRMED':
      case 'ORDER_PROCESSING':
      case 'ORDER_SHIPPED':
      case 'ORDER_DELIVERED':
      case 'ORDER_CANCELLED':
        return <Package size={20} color="#52b788" />;
      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_FAILED':
        return <CreditCard size={20} color="#1b4332" />;
      case 'COUPON':
      case 'PROMOTION':
        return <Tag size={20} color="#ffb703" />;
      default:
        return <Info size={20} color="#5c6e63" />;
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <p style={{ color: '#5c6e63' }}>Loading your notifications...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <Breadcrumbs items={[{ label: 'Notifications' }]} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#1b4332', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={24} color="#1b4332" /> Notifications
          </h1>
          {unreadCount > 0 && (
            <span style={{ fontSize: '0.85rem', color: '#5c6e63' }}>
              You have <strong>{unreadCount}</strong> unread notification{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', backgroundColor: '#e2e8e4', borderRadius: '99px', padding: '0.2rem' }}>
            <button
              onClick={() => { setActiveFilter('ALL'); setPage(1); }}
              style={{
                background: activeFilter === 'ALL' ? '#1b4332' : 'transparent',
                color: activeFilter === 'ALL' ? '#ffffff' : '#5c6e63',
                border: 'none',
                padding: '0.35rem 0.85rem',
                borderRadius: '99px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              All
            </button>
            <button
              onClick={() => { setActiveFilter('UNREAD'); setPage(1); }}
              style={{
                background: activeFilter === 'UNREAD' ? '#1b4332' : 'transparent',
                color: activeFilter === 'UNREAD' ? '#ffffff' : '#5c6e63',
                border: 'none',
                padding: '0.35rem 0.85rem',
                borderRadius: '99px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Unread
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #c8d6ce',
                color: '#1b4332',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <CheckCheck size={16} /> Mark All as Read
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="No Notifications Found"
          message={activeFilter === 'UNREAD' ? "You're all caught up! No unread notifications." : "You have no notifications yet."}
          actionText="Back to Shop"
          actionLink="/shop"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className="glass-card"
              style={{
                padding: '1.25rem',
                borderRadius: '16px',
                backgroundColor: notif.isRead ? '#ffffff' : '#f4f9f6',
                borderLeft: notif.isRead ? '4px solid #e2e8e4' : '4px solid #52b788',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: notif.isRead ? '#f0f4f1' : '#d8f3dc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {getNotificationIcon(notif.type)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <strong style={{ fontSize: '0.95rem', color: '#1b4332' }}>{notif.title}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#8e9e94' }}>
                    {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#5c6e63', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
                  {notif.message}
                </p>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {notif.orderNumber && (
                    <Link
                      to={`/orders/${notif.orderNumber}`}
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#1b4332',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                      }}
                    >
                      View Order Details <ChevronRight size={14} />
                    </Link>
                  )}

                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notif._id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#52b788',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                      }}
                    >
                      <Check size={14} /> Mark Read
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteNotification(notif._id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#8e9e94',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      padding: 0,
                      marginLeft: 'auto',
                    }}
                    title="Delete Notification"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #c8d6ce', cursor: 'pointer' }}
          >
            Previous
          </button>
          <span style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', color: '#1b4332' }}>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #c8d6ce', cursor: 'pointer' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
