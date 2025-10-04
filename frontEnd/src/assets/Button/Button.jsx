import React from 'react'
import './Button.css'

const Button = ({ type, priority, icon, children, onClick, disabled = false}) => {
    return (
        <button type={type} className={`btn ${priority === 'primary' ? 'btn-primary' : 'btn-secondary'} ${disabled ? 'btn-disabled' : ''}`} disabled={disabled} onClick={onClick}>
            <i className={icon}></i>
            {children}
        </button>
    )
}

export default Button