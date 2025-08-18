module.exports = {
    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    },

    validatePhoneNumber: function(phone) {
        const re = /^\d{10}$/;
        return re.test(String(phone));
    },

    formatDate: function(date) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(date).toLocaleDateString(undefined, options);
    },

    generateUniqueId: function() {
        return 'id-' + Math.random().toString(36).substr(2, 16);
    },

    isEmpty: function(obj) {
        return Object.keys(obj).length === 0;
    }
};