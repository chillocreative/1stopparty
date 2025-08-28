import React from 'react';

function SimpleCard({ className, children, ...props }) {
    return React.createElement(
        'div',
        {
            className: `rounded-lg border bg-card text-card-foreground shadow-sm ${className || ''}`,
            ...props
        },
        children
    );
}

export { SimpleCard };