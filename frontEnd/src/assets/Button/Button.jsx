import React from 'react'
import './Button.css'

const Button = ({ type, priority, icon, children = null, onClick, disabled = false, className = null}) => {
    return (
        <button type={type} className={`btn ${priority === 'primary' ? 'btn-primary' : 'btn-secondary'} ${disabled ? 'btn-disabled' : ''} ${className}`} disabled={disabled} onClick={onClick}>
            <i className={icon}></i>
            {children}
        </button>
    )
}

export default Button