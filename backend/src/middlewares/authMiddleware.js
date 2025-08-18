const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    console.log('authMiddleware - Request path:', req.path);
    console.log('authMiddleware - Headers:', Object.keys(req.headers));
    
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    
    if (!authHeader) {
        console.error('authMiddleware - No Authorization header found');
        return res.status(401).json({ error: 'Please authenticate. No Authorization header.' });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
        console.error('authMiddleware - Invalid Authorization format:', authHeader.substring(0, 15) + '...');
        return res.status(401).json({ error: 'Please authenticate. Invalid Authorization format.' });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('authMiddleware - Token present:', !!token);
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('authMiddleware - Decoded token:', decoded);
        req.user = decoded; // { id, role }
        next();
    } catch (err) {
        console.error('authMiddleware - Token verification error:', err.message);
        return res.status(401).json({ error: 'Please authenticate. Invalid token.' });
    }
};