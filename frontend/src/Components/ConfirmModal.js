import React, { createContext, useContext, useState, useCallback } from 'react';
import { FaExclamationTriangle, FaQuestionCircle, FaInfoCircle } from 'react-icons/fa';
import './ConfirmModal.css';

const ConfirmContext = createContext();

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
};

export const ConfirmProvider = ({ children }) => {
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm: null,
        onCancel: null,
        type: 'warning', // warning, danger, info
    });

    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                title: options.title || 'Confirm Action',
                message: options.message || 'Are you sure?',
                confirmText: options.confirmText || 'Confirm',
                cancelText: options.cancelText || 'Cancel',
                type: options.type || 'warning',
                onConfirm: () => {
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                    resolve(true);
                },
                onCancel: () => {
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                    resolve(false);
                },
            });
        });
    }, []);

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {confirmState.isOpen && (
                <div className="confirm-modal-overlay" onClick={confirmState.onCancel}>
                    <div className="confirm-modal" onClick={e => e.stopPropagation()}>
                        <div className={`confirm-modal-header confirm-${confirmState.type}`}>
                            <span className="confirm-modal-icon">
                                {confirmState.type === 'danger' && <FaExclamationTriangle />}
                                {confirmState.type === 'warning' && <FaQuestionCircle />}
                                {confirmState.type === 'info' && <FaInfoCircle />}
                            </span>
                            <h3 className="confirm-modal-title">{confirmState.title}</h3>
                        </div>
                        <div className="confirm-modal-body">
                            <p className="confirm-modal-message">{confirmState.message}</p>
                        </div>
                        <div className="confirm-modal-footer">
                            <button
                                className="confirm-modal-btn confirm-modal-cancel"
                                onClick={confirmState.onCancel}
                            >
                                {confirmState.cancelText}
                            </button>
                            <button
                                className={`confirm-modal-btn confirm-modal-confirm confirm-${confirmState.type}`}
                                onClick={confirmState.onConfirm}
                            >
                                {confirmState.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
};
