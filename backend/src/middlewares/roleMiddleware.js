const jwt = require('jsonwebtoken');

const roleMiddleware = (roles) => {
    return (req, res, next) => {
        const token = req.headers['authorization']?.split(' ')[1] || req.headers['Authorization']?.split(' ')[1];
        
        console.log('roleMiddleware - Token present:', !!token);
        
        if (!token) {
            return res.status(403).json({ message: 'No token provided.' });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.error('JWT verification error:', err.message);
                return res.status(401).json({ message: 'Unauthorized! Token invalid.' });
            }

            req.user = decoded;
            console.log('roleMiddleware - Decoded user:', req.user);

            // Make role check case-insensitive
            const userRole = (req.user.role || '').toLowerCase();
            const allowedRoles = Array.isArray(roles) ? roles.map(r => r.toLowerCase()) : [(roles || '').toLowerCase()];

            console.log('roleMiddleware - User role:', userRole);
            console.log('roleMiddleware - Allowed roles:', allowedRoles);

            if (!allowedRoles.includes(userRole)) {
                console.log('roleMiddleware - Access denied: role not allowed');
                return res.status(403).json({ message: 'Forbidden: You do not have the right permissions.' });
            }

            console.log('roleMiddleware - Access granted');
            next();
        });
    };
};

module.exports = roleMiddleware;